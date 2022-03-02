import { Stack, StackProps, Tag, Aspects } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as path from 'path';

export class EnvironmentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'CafeVPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 2, 
      subnetConfiguration: [
        {
          name: 'private-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24,
        },
        {
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'isolated-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        }
      ],
      natGatewayProvider: ec2.NatProvider.instance({
        instanceType: new ec2.InstanceType('t2.micro'),
      }),      
    });

    Aspects.of(vpc).add(new Tag('Name', 'cafe-vpc'));

    const securityGroup = new ec2.SecurityGroup(this, 'security-group-id', { vpc });

    function tagSubnets(subnets: ec2.ISubnet[], tagName: string, tagValue: string) {
      for (const subnet of subnets) {
        Aspects.of(subnet).add(new Tag(tagName, tagValue));
      }

    tagSubnets(vpc.privateSubnets, 'Name', `cafe-vpc-private-`);
    tagSubnets(vpc.privateSubnets, 'Name', `cafe-vpc-public-`);
  }
 }
}
