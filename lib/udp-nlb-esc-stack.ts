import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import {
  NetworkMode,
  Cluster, ContainerImage, Ec2Service, Ec2TaskDefinition, FargateService, TaskDefinition, Protocol as ECSProtocol, AwsLogDriver, PortMapping
} from 'aws-cdk-lib/aws-ecs'
import { InstanceType, Peer, Port, SecurityGroup, Vpc, Protocol as EC2Protocol } from 'aws-cdk-lib/aws-ec2'
import { NetworkLoadBalancer, Protocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { NetworkLoadBalancedEc2Service, NetworkLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns'
import { Repository } from 'aws-cdk-lib/aws-ecr'
import { Effect, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { DockerImageAsset, } from 'aws-cdk-lib/aws-ecr-assets'
export class UdpNlbEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)


    const vpc = new Vpc(this, 'Vpc', { maxAzs: 2 })

    // Create an ECS cluster
    const cluster = new Cluster(this, 'Cluster', { vpc, })

    // Add capacity to it
    cluster.addCapacity('capacity', {
      instanceType: new InstanceType('t3.small'),
      minCapacity: 1,
      maxCapacity: 3,

    })

    const internalLB = new NetworkLoadBalancer(this, 'internal', {
      vpc: vpc,
      internetFacing: true,

    })

    const executionRole = new Role(this, 'exeRole', {
      assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
      inlinePolicies: {
        'something': new PolicyDocument({
          statements: [new PolicyStatement(
            {
              effect: Effect.ALLOW,
              resources: ['arn:aws:iam::123456789012:role/something'],
              actions: ['sts:AssumeRole']
            }
          )]
        })
      }
    })

    const nameTaskDefinition = new Ec2TaskDefinition(this, 'name-task-definition', {
      executionRole,
      networkMode: NetworkMode.AWS_VPC
    })
    const PORT = 9999
    const HEALTH_PORT = 8888

    nameTaskDefinition.addContainer('dummyContainer', {
      image: ContainerImage.fromDockerImageAsset(new DockerImageAsset(this, 'docker', {
        directory: './app',
      })),
      memoryLimitMiB: 128,
      environment: {
        PORT: '' + PORT,
        HEALTH_PORT: '' + HEALTH_PORT
      },
      logging: new AwsLogDriver({ streamPrefix: 'foobar' }),
      command: ['start'],

      portMappings: [

        {
          containerPort: PORT,
          hostPort: PORT,
          protocol: ECSProtocol.UDP
        },
        {
          containerPort: HEALTH_PORT,
          hostPort: HEALTH_PORT,
          protocol: ECSProtocol.TCP
        }
      ]
    })

    // scope down it is being eval'd as client ip today....
    const sg = new SecurityGroup(this, 'sg', { vpc, allowAllOutbound: true })
    sg.addIngressRule(Peer.anyIpv4(), Port.udp(PORT))
    sg.addIngressRule(Peer.anyIpv4(), Port.tcp(HEALTH_PORT))

    // todo: foreach ->
    // sg.addIngressRule(Peer.ipv4(vpc.publicSubnets[0].ipv4CidrBlock), Port.udp(PORT))
    // sg.addIngressRule(Peer.ipv4(vpc.publicSubnets[0].ipv4CidrBlock), Port.udp(PORT))
    // sg.addIngressRule(Peer.ipv4(vpc.publicSubnets[0].ipv4CidrBlock), Port.tcp(HEALTH_PORT))
    // sg.addIngressRule(Peer.ipv4(vpc.publicSubnets[1].ipv4CidrBlock), Port.tcp(HEALTH_PORT))




    const nameService = new Ec2Service(this, 'service', {
      cluster: cluster,
      desiredCount: 1,

      taskDefinition: nameTaskDefinition,
      securityGroups: [sg]
    })

    const internalListener = internalLB.addListener('PublicListener', { port: PORT, protocol: Protocol.UDP, })

    internalListener.addTargets('name', {
      port: PORT,

      targetGroupName: 'name',
      protocol: Protocol.UDP,
      healthCheck: { port: '' + HEALTH_PORT, protocol: Protocol.TCP },

      // healthCheck
      targets: [nameService.loadBalancerTarget({
        containerPort: PORT,
        protocol: ECSProtocol.UDP,
        containerName: 'dummyContainer',

      })]
    })
  }
}
