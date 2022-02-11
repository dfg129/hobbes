import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class EventbridgeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bus = new events.EventBus(this, 'hobbes-events', {
      
    });

    new ssm.StringParameter(this, 'HobbesEventBus', {
      allowedPattern:'.*',
      description: 'Custom hobbes event bus name',
      parameterName: 'HobbesEventBus',
      tier: ssm.ParameterTier.ADVANCED,
      stringValue: bus.eventBusName,
    });

  }
}
