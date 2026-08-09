import { IsEmail, IsOptional, IsUrl } from 'class-validator';

// require_tld: false - a local dev/test success/cancel URL (e.g.
// http://localhost:3000/...) has no TLD and would otherwise be rejected.
export class CreateCheckoutSessionDto {
  @IsUrl({ require_tld: false })
  successUrl: string;

  @IsUrl({ require_tld: false })
  cancelUrl: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;
}
