import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, InstanceType } from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { PrivateDnsNamespace } from 'aws-cdk-lib/aws-servicediscovery';
import { AwsLogDriver, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { Repository } from 'aws-cdk-lib/aws-ecr';


export class ECSCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, 'VPC', {
      vpcName: 'cafe-vpc'
    });

    const namespace = new PrivateDnsNamespace(this, 'PrivateNamespace', {
      vpc,
      name: 'hobbes.space',
    })

    const cluster = new ecs.Cluster(this, 'ECS', {
      vpc,
    });

    cluster.addCapacity('Fargate', {
      minCapacity: 1,
      instanceType: new InstanceType('c6g.large'),
      machineImageType: ecs.MachineImageType.BOTTLEROCKET,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskApacheServer', {
    

    });

    const logging = new AwsLogDriver({
      streamPrefix: 'hobbes-fargate',
    });

    const container = taskDefinition.addContainer('DefaultContainer', {
      image: ecs.ContainerImage.fromEcrRepository(Repository.fromRepositoryName(this, 'RepoName', 'hello-repository')),
      memoryLimitMiB: 512,
      logging,
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    })

    // const pretask = new ecs.FargateTaskDefinition(this, 'PrebuildTask');

    // . pretask.taskDefinitionArn =  'arn:aws:ecs:us-east-1:707338571369:task-definition/tt2:1'
    
  
    const alb = new ApplicationLoadBalancedFargateService(this, 'FargateServer', {
      publicLoadBalancer: true,
      taskDefinition,
      cluster,
      cloudMapOptions: {
        cloudMapNamespace: namespace,
        container,
        containerPort: 80,
      }
    });

    new CfnOutput(this, 'ELBOut', {
      value: alb.loadBalancer.loadBalancerDnsName,
    });
  }
}
