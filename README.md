# what
udp service + nlb on ECS, built out using CDK

# why? (as of july 2023)
NLB only does TCP health check and exposed ports are udp OR tcp , so cant have health check on udp listener

# how
expose second listener on tcp on different port

lets us get nlb container registered as healthy

# todo
better health check for container + target (maybe have it confirm connectivity)
