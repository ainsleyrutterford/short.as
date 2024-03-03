import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TinyMuStack } from '../lib/stack';

test('Stack matches snapshot', () => {
  /* Given */
  const app = new cdk.App();
  
  /* When */
  const stack = new TinyMuStack(app, 'TestTinyMuStack');
  const template = Template.fromStack(stack);
  
  /* Then */
  expect(template.toJSON()).toMatchSnapshot();
});
