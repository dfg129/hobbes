import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import { AmazonLinuxImage } from 'aws-cdk-lib/aws-ec2';

export class EventbridgeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bus = new events.EventBus(this, 'hobbes-events', {
      
    });

    /** waiting on cdk update to s3 event targets */
    // const eventRule = new events.Rule(this, 'DataUploadRule', {
    //   description: "Data upload occurred",
    //   enabled: true,
    //   eventBus: bus,
    // });

    // eventRule.addEventPattern(
    //   {
    //     "source": ["*"]
    //   }
    // );


    let bus_parameter = new ssm.StringParameter(this, 'HobbesEventBus', {
      allowedPattern:'.*',
      description: 'Custom hobbes event bus name',
      parameterName: 'HobbesEventBus',
      tier: ssm.ParameterTier.ADVANCED,
      stringValue: bus.eventBusName,
    });

     bus_parameter.grantRead(new iam.AccountPrincipal(this.account));

  }
}
