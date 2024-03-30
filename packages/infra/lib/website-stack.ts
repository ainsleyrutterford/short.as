import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as path from 'path';

interface WebsiteStackProps extends cdk.StackProps {
  httpApi: apigateway.HttpApi;
};

export class WebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebsiteStackProps) {
    super(scope, id, props);

    const { url: httpApiUrl } = props.httpApi;

    if (!httpApiUrl) throw new Error("HTTP API Gateway does not have a URL");

    const bucket = new s3.Bucket(this, 'Bucket');

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity');
    bucket.grantRead(originAccessIdentity);

    const htmlRedirectFunction = new cloudfront.Function(this, 'HtmlRedirectFunction', {
      code: cloudfront.FunctionCode.fromFile({ filePath: path.resolve(__dirname, './cloudfront-functions/html-redirect.js') }),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    });

    const rootRedirectFunction = new cloudfront.Function(this, 'RootRedirectFunction', {
      code: cloudfront.FunctionCode.fromFile({ filePath: path.resolve(__dirname, './cloudfront-functions/root-redirect.js') }),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      // API Gateway origin behavior
      defaultBehavior: {
        // https://github.com/aws/aws-cdk/issues/1882#issuecomment-518680023
        origin: new HttpOrigin(cdk.Fn.select(2, cdk.Fn.split('/', httpApiUrl)), { originPath: '/get-long-url' }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          // If someone visits just the root domain, redirect to the website in the S3 bucket
          { eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: rootRedirectFunction },
        ]
      },
      // S3 origin behavior
      additionalBehaviors: {
        '/site*': {
          origin: new S3Origin(bucket, { originAccessIdentity }),
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          functionAssociations: [
            // Allows users to visit just 'domain/hello', rather than 'domain/hello.html'. Also redirects
            // from 'domain/directory/' to 'domain/directory/index.html'
            { eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: htmlRedirectFunction },
          ]
        }
      },
      errorResponses: [{
        httpStatus: 404,
        responseHttpStatus: 404,
        responsePagePath: '/site/404.html',
      }],
    });

    const bucketDeployment = new BucketDeployment(this, 'BucketDeployment', {
      destinationBucket: bucket,
      distribution,
      destinationKeyPrefix: 'site/',
      sources: [Source.asset(path.resolve(__dirname, '../../site/out'))]
    });
  }

  createResourceName(suffix: string) {
    return `${this.stackName}-${suffix}`;
  }
}
