import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { NetworkLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Vpc } from 'aws-cdk-lib/aws-ec2';

declare const asg: AutoScalingGroup;

export class NLBCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, 'VPC', {
      vpcName : "cafe-vpc",
    })

    const nlb = new NetworkLoadBalancer(this, 'NLB', {
      vpc,
      internetFacing: true
    });

  }
}
