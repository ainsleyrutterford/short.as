import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

interface ProdDomainStackProps extends cdk.StackProps {};

/**
 * This stack creates:
 * - the Route53 HostedZone that will act as the DNS service for the short.as domain
 * - the SSL/TLS certificate for the domain
 * 
 * This should only be deployed to prod, and should only be deployed to the `us-east-1` region
 * since ACM certificates that are used with CloudFront must be in the `us-east-1` region.
 * 
 * Documentation about using Route53 as the DNS service for a domain:
 * https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/migrate-dns-domain-inactive.html
 * 
 * Documentation about accessing an ACM certificate cross stack/region:
 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_certificatemanager-readme.html#cross-region-certificates
 */
export class ProdDomainStack extends cdk.Stack {
  public hostedZone: route53.HostedZone;

  public certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props: ProdDomainStackProps) {
    super(scope, id, props);

    this.hostedZone = new route53.HostedZone(this, 'HostedZone', { zoneName: 'short.as' });

    // TODO: set up redirects from www.short.as to short.as
    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName: 'short.as',
      subjectAlternativeNames: ['www.short.as'],
      validation: acm.CertificateValidation.fromDns(this.hostedZone)
    });
  }
}
