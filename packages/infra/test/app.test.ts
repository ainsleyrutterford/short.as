import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TinyMuStack } from '../lib/stack';

// https://blog.bigbandsinger.dev/robust-cdk-snapshot-testing-with-snapshot-serializers
const s3KeyMatch = new RegExp(`[A-Za-z0-9]+\.zip`);
expect.addSnapshotSerializer({
  test: (val) => typeof val === 'string' && (val.match(s3KeyMatch) != null),
  print: (val) => {
    // Substitute both the bucket part and the asset zip part
    let sval = `${val}`;
    sval = sval.replace(s3KeyMatch, '[S3 KEY]');
    return `"${sval}"`;
  }
});

test('Stack matches snapshot', () => {
  /* Given */
  const app = new cdk.App();
  
  /* When */
  const stack = new TinyMuStack(app, 'TestTinyMuStack');
  const template = Template.fromStack(stack);
  
  /* Then */
  expect(template.toJSON()).toMatchSnapshot();
});