what
udp service + nlb on ECS

why? (as of july 2023)
NLB only does TCP health check and exposed ports are udp OR tcp , so cant have health check on udp listener

how
expose second listener on tcp on different port

lets us get nlb regiseter as healthy

todo
sample docker container - shared healthy state b/w 2 servers
confirm on SG rules (had to manually open up ec2)
rebuild code using ecs lib

# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
