import { Link } from 'react-router-dom';
import { legalDocumentMetadata, type LegalDocumentKey } from '../../utils/legalVersions';

export type LegalDocument = LegalDocumentKey;

type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalDocumentContent = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

const company = 'Leadingedge Astute-Minds Limited';
const documents: Record<LegalDocument, LegalDocumentContent> = {
  terms: {
    title: 'Terms and Conditions',
    intro: `These draft Terms and Conditions apply to use of LEAMJobs, a platform by ${company} (the “Company”, “we”, “us” or “our”). The Company is based in Ibadan, Oyo State, Nigeria, and the platform may be accessed internationally. This document is a draft for qualified legal counsel and Company review; it is not legal advice or an assurance of compliance in every country.`,
    sections: [
      { title: '1. Eligibility and scope', paragraphs: [
        'You must be at least 18 years old and legally able to enter into a binding agreement to create or use an account. LEAMJobs serves job seekers, employers and freelancers. Do not use the platform if doing so would violate a law that applies to you.',
        'These terms apply together with any applicable [Employer Terms](/employer-terms), [Freelancer Terms](/freelancer-terms), and the [Payment, Refund and Escrow Policy](/payment-policy). If a transaction-specific term conflicts with this draft, the applicable order of precedence must be confirmed by the Company and counsel.',
      ] },
      { title: '2. Accounts and security', paragraphs: [
        'Provide accurate, current information and keep it updated. You are responsible for activity through your account, protecting your credentials and promptly reporting suspected unauthorized access through the [Contact page](/contact). Do not share account access or impersonate another person or organization.',
        'The Company may request information or documents for account, employer or transaction verification where supported by the service. The types of verification, review standards, retention and any consequences require Company confirmation.',
      ] },
      { title: '3. Job seeker responsibilities', paragraphs: [
        'Job seekers must keep profiles, CVs, qualifications and application information accurate, and submit applications only where they have a genuine interest. Do not misrepresent experience, submit another person’s information without authority, or use the service to harass, discriminate against or deceive others.',
      ] },
      { title: '4. Employer responsibilities', paragraphs: [
        'Employers must provide accurate company and vacancy details, use applicant information for legitimate recruitment purposes, and comply with applicable employment, privacy, anti-discrimination and consumer-protection laws. Do not post fictitious, discriminatory, unlawful or misleading opportunities or request unlawful payments from applicants.',
        'Employer verification features do not amount to a guarantee of an employer’s conduct, solvency, vacancy or identity unless the Company expressly confirms otherwise.',
      ] },
      { title: '5. Freelancer and client responsibilities', paragraphs: [
        'Before work begins, the parties should agree in writing on scope, deliverables, milestones, schedule, acceptance criteria, price, revisions and responsibility for expenses. Each party must communicate honestly, perform its agreed obligations and use the platform only for lawful work.',
        'The [Freelancer Terms](/freelancer-terms) and [Employer Terms](/employer-terms) supplement these terms for freelance engagements. They do not determine employee or contractor status; the parties must comply with applicable law.',
      ] },
      { title: '6. Listings, applications and prohibited conduct', paragraphs: [
        'You may not use LEAMJobs to distribute malware, scrape or harvest personal information without authorization, evade platform controls, manipulate applications or reviews, infringe rights, facilitate fraud, discriminate unlawfully, publish unlawful content, or solicit prohibited payments.',
        'The Company may review, restrict or remove content where permitted by law and its operational procedures. Moderation scope, notice and appeal procedures must be confirmed before final publication.',
      ] },
      { title: '7. Contracts, fees and payments', paragraphs: [
        'A platform listing or introduction does not itself create a contract between users. Users remain responsible for their agreements, taxes, authorizations and legal obligations. Fees, plans and payment amounts must be shown in the applicable checkout or transaction flow before confirmation.',
        'Payment features depend on supported currencies, provider availability and operational settings. Review the current [Payment, Refund and Escrow Policy](/payment-policy) and transaction screen. Do not assume a payment is final, refundable, reversible, or protected by escrow unless the relevant transaction status and applicable terms confirm it.',
      ] },
      { title: '8. Intellectual property and user content', paragraphs: [
        'You retain rights you hold in content you submit, subject to rights needed by the Company to operate and display the service. The precise platform licence, permitted duration, sublicensing and post-termination treatment require Company and counsel confirmation before publication. Do not submit materials you do not have the right to use.',
        'Ownership or licensing of work created under a freelancer-client contract must be agreed by those parties and must not be inferred from use of the platform.',
      ] },
      { title: '9. Availability and platform role', paragraphs: [
        'The Company may update, maintain or discontinue features. The platform is provided subject to applicable law and does not guarantee uninterrupted access, job placement, hiring, project completion, payment or a particular user’s conduct. The Company’s precise role in verification, matching and contract performance requires legal and operational confirmation.',
      ] },
      { title: '10. Suspension and termination', paragraphs: [
        'The Company may restrict or suspend an account where reasonably necessary to protect users, investigate suspected misuse, comply with law, or enforce applicable terms. The final notice, review, appeal and termination procedures require Company confirmation.',
        'Account closure does not necessarily remove records that must be retained for contracts, financial integrity, disputes, fraud prevention or legal obligations. See the [Privacy Policy](/privacy) for the current, limited description of account anonymisation and the need to confirm retention rules.',
      ] },
      { title: '11. Liability and statutory rights', paragraphs: [
        'Nothing in these draft terms excludes or limits a right or remedy that cannot lawfully be excluded or limited. Any limitation of liability, allocation of risk, indemnity or exclusion for indirect loss must be reviewed by qualified counsel for the jurisdictions in which the terms will be used.',
      ] },
      { title: '12. Disputes, changes and contact', paragraphs: [
        'Users should first try to resolve disputes directly and use any supported platform reporting or dispute feature. The Company’s formal complaint process, governing law, court or alternative-dispute forum and response times are pending confirmation; no forum is designated by this draft.',
        'The Company may revise terms with notice as required by applicable law. Material changes may require renewed acceptance. Effective date and notice procedure are pending Company and counsel approval. Contact the Company using the existing [Contact page](/contact).',
      ] },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: `This draft describes data processing for LEAMJobs, a platform by ${company}, based in Ibadan, Oyo State, Nigeria and serving users internationally. It is not legal advice or a guarantee of compliance in every jurisdiction. Processing and applicable rights depend on the user, location and actual service configuration. The Company must confirm the data inventory, purposes, lawful bases, recipients, retention and transfer arrangements before publication.`,
    sections: [
      { title: '1. Information that may be processed', paragraphs: [
        'Account details include name, email address, phone number, role, authentication and account-status information. Profiles and recruiting activity may include profile photographs, CVs, employment history, education, skills, job preferences, vacancies, applications and messages exchanged through the platform.',
        'Employers may submit company and verification materials. The codebase includes employer-verification document uploads, but a general government-ID or individual KYC process was not confirmed. Users may submit identity information within documents; the Company must confirm exactly what is collected and why.',
        'Payment features process transaction, wallet, ledger, withdrawal and payout details. Payout identifiers are encrypted in the existing backend implementation, but the complete information inventory and operational controls require confirmation. Residential addresses, IP addresses, device identifiers, server logs and other technical data must be confirmed against production configuration.',
      ] },
      { title: '2. Purposes and lawful bases', paragraphs: [
        'Information may be used to create and secure accounts, provide profiles, job search, applications, hiring and communications, process transactions and withdrawals, support users, prevent abuse, keep financial records and meet legal duties. The Company must map each actual purpose to its applicable lawful basis before publication.',
        'Depending on the processing and applicable law, potential bases may include performing a contract or taking steps requested before a contract, compliance with a legal obligation, legitimate interests assessed against users’ rights, or consent where consent is required. The Privacy Policy acknowledgement at registration is not blanket consent for all processing. Optional marketing communications and any future non-essential tracking require their own choices where applicable.',
      ] },
      { title: '3. Cookies and browser storage', paragraphs: [
        'The frontend stores authentication tokens and cookie-preference choices in browser local storage; local storage is not a cookie. The preference record includes necessary=true, optional analytics and marketing choices, a saved time and policy version. The code review found no active analytics or advertising tags. See the [Cookie Policy](/cookies) for the current inventory and preference controls.',
      ] },
      { title: '4. Recipients and service providers', paragraphs: [
        'Data may be accessed by authorized Company personnel and service providers needed to operate the service, process email, store submitted files, support sign-in or process payments. The codebase contains integrations for Google OAuth, AWS S3-compatible storage, email delivery, Paystack and Flutterwave. This does not confirm which providers are enabled in production, their contracting entities, regions, access, retention or use of data. The Company must verify and publish that information.',
        'The Company may also disclose information where required by law, to protect users or the service, or in connection with a corporate transaction, subject to applicable law. Actual disclosure practices require confirmation.',
      ] },
      { title: '5. International transfers', paragraphs: [
        'Because the platform operates internationally and uses external service integrations, data may be processed outside the country where a user is located. Production data locations, transfer destinations, safeguards and applicable transfer mechanisms have not been verified and must be confirmed before publication. Where required, the Company will use legally recognized safeguards and provide information about them.',
      ] },
      { title: '6. Security and data incidents', paragraphs: [
        'The backend uses access controls, authentication, rate limiting, encryption for payout identifiers and provider verification flows. This code review is not a security certification or a complete assessment of infrastructure, operational controls, backups or incident response. The Company must confirm its implemented safeguards and breach-response procedures.',
        'Where a personal-data incident occurs, the Company will assess it and make notifications required by the laws that apply, including applicable regulator and user notification duties. Applicable timelines depend on the jurisdiction and incident.',
      ] },
      { title: '7. Retention and deletion', paragraphs: [
        'The Company retains information only for as long as required for the relevant service purpose, legal duties, financial records, contract administration, disputes and fraud prevention. Specific retention periods, backup deletion schedules and provider retention have not been verified and must be confirmed.',
        'The existing backend includes an administrator-operated account anonymisation flow that removes or replaces certain user/profile information while preserving contract and financial history. A self-service deletion route was not identified in the code review. A request does not automatically erase records that the Company must lawfully retain.',
      ] },
      { title: '8. Your rights and choices', paragraphs: [
        'Depending on applicable law, you may have rights to access, correct, erase, restrict or object to certain processing, request portability, withdraw consent where consent is the basis, or complain to a relevant supervisory authority. Nigerian users may have rights under the Nigeria Data Protection Act 2023 and applicable NDPC requirements. GDPR or UK GDPR rights apply only where their territorial and material scope is met; other local laws may also apply.',
        'To make a request, use the existing [Contact page](/contact). The Company must confirm the responsible privacy contact, identity-verification process, response timelines, complaint handling and any data protection officer details before publication. Do not send passwords, full bank details or identity documents through ordinary contact forms.',
      ] },
      { title: '9. Children and age restriction', paragraphs: [
        'LEAMJobs is intended only for people aged 18 or older. The Company does not knowingly invite children to register. If you believe a person under 18 has provided personal data, contact the Company using the [Contact page](/contact) so it can assess the request under applicable law.',
      ] },
      { title: '10. Updates and contact', paragraphs: [
        'The Company may update this Policy when processing changes or as required by law. Effective date, version approval and any notice process are pending Company and legal-counsel confirmation. For privacy questions or complaints, use the existing [Contact page](/contact).',
      ] },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    intro: 'This draft describes the frontend storage and tracking behavior identified in the code review. It is not legal advice. The complete production cookie, local-storage and third-party resource inventory, purposes, lifetimes and jurisdictions require Company confirmation.',
    sections: [
      { title: '1. Cookies and browser storage are different', paragraphs: [
        'The reviewed frontend stores the authentication token and cookie preferences in local storage. The preference record is not a cookie and does not contain passwords, identity documents or bank details. The code review did not find application code that sets authentication or consent cookies.',
        'The public page also loads a Font Awesome stylesheet from cdnjs. This is a third-party resource request, not evidence that the resource sets a cookie; the Company should confirm production network behavior and provider terms.',
      ] },
      { title: '2. Strictly necessary', paragraphs: [
        'Necessary browser storage supports core account and preference functionality and is not switchable off in the settings interface. The actual storage inventory, lifetime and any legal classification must be confirmed for production.',
      ] },
      { title: '3. Analytics and marketing', paragraphs: [
        'The source review found no active analytics tags, advertising tags or tracking pixels. These optional categories therefore do not currently activate a tracking script. If optional integrations are added later, they must remain disabled until a valid, current preference allows the relevant category, and must be disclosed before activation.',
      ] },
      { title: '4. Choosing and changing preferences', paragraphs: [
        'The preference interface offers Accept all, Reject optional and Customize preferences. Analytics and marketing default to off; necessary is always on. Choices are stored in this browser’s local storage with a timestamp and policy version. A policy-version change causes the interface to request a fresh choice.',
        'Use the persistent Cookie settings control to reopen settings, save custom choices or withdraw optional choices. Clearing browser storage may remove the saved preference. If storage is unavailable, the interface reports that the choice could not be saved and optional categories remain unauthorized.',
      ] },
      { title: '5. Current inventory and updates', paragraphs: [
        'This review identified local-storage use for authentication and cookie preferences, and the Font Awesome CSS request described above. No analytics or advertising cookie provider is currently confirmed. The Company must verify production cookies, SDKs, embedded content, server-side tracking, consent expiration and policy effective date before publication.',
      ] },
    ],
  },
  payments: {
    title: 'Payment, Refund and Escrow Policy',
    intro: 'Draft for Company, payment-provider and qualified legal-counsel review. This page summarizes payment behavior visible in the current code; it does not promise a refund, custody arrangement, payout timing or provider guarantee. Check the transaction screen and applicable provider terms before paying.',
    sections: [
      { title: '1. Payment features and availability', paragraphs: [
        'The backend includes subscription checkout, contract-funding, wallet/ledger, withdrawal and payout flows. New freelance funding, escrow release and withdrawals are feature-gated and may be unavailable. Currency and provider support depend on current configuration; do not assume any feature or currency is active for your account.',
        'The code includes Paystack collection for NGN contract funding when the feature is enabled and fully configured, and Flutterwave payment initialization and verification. Payment provider activation, supported transaction types and current checkout terms must be confirmed by the Company.',
      ] },
      { title: '2. Contract funding and escrow status', paragraphs: [
        'For supported contracts, the backend validates the contract, currency, amount and saved fee/entitlement values, initializes payment with a supported provider, and verifies provider transactions before marking the related escrow funded. Payment and escrow states are tracked in the platform, with ledger records used for financial history.',
        'The presence of an escrow record or a platform status does not establish that funds are held in a legally protected trust or by an independent escrow agent. Who legally holds funds, safeguarding arrangements, release conditions, insolvency treatment and any guarantee must be confirmed by the Company, provider and counsel. No guaranteed recovery or outcome is promised by this draft.',
      ] },
      { title: '3. Fees, currencies and checkout', paragraphs: [
        'Contract fee and payout values are stored with the contract and funding records; withdrawal fees are supplied through a configured fee schedule and shown in a quote before confirmation. Actual fees, taxes, supported currencies, conversion and provider charges depend on the transaction screen, account eligibility and current configuration. Confirm the full amount and currency before authorizing a payment.',
        'A redirect back from a payment provider is not by itself proof of settlement. The platform uses provider verification and webhook/reconciliation flows to update payment status. Do not treat a pending or failed status as a completed payment.',
      ] },
      { title: '4. Refunds, cancellations and disputes', paragraphs: [
        'The code review did not establish a general automatic refund entitlement, refund timeline or universal cancellation right. Whether funds can be returned depends on provider settlement, contract status, transaction history, applicable law and the outcome of any supported dispute process. Do not assume that a payment can be reversed or that a refund is guaranteed.',
        'Contract disputes and escrow-related states are represented in the backend, but eligibility, evidence requirements, decision-maker, response timelines and refund outcomes require Company and legal confirmation. Review contract terms and raise questions through the existing [Contact page](/contact).',
      ] },
      { title: '5. Withdrawals and payouts', paragraphs: [
        'The backend creates a withdrawal quote tied to the account, amount, currency, payout account and current fee configuration. A confirmed request reserves funds in the pending-withdrawal balance and may proceed to provider execution; withdrawals are subject to feature availability, verification, supported payout countries/currencies and provider review.',
        'The system does not establish a guaranteed processing time. Failed transfers, payout fees, bank processing, intermediary charges and return handling depend on provider and banking rules. Check the quote and status information displayed for your transaction.',
      ] },
      { title: '6. Contact and confirmation', paragraphs: [
        'Before this Policy is published as final, the Company must confirm refund rules, cancellations, dispute process, applicable fee schedules, enabled providers and currencies, custody arrangements, payout timing and support escalation. Use the existing [Contact page](/contact) for transaction questions.',
      ] },
    ],
  },
  freelancer: {
    title: 'Freelancer Terms',
    intro: 'These draft supplemental terms apply to freelancers using LEAMJobs and should be read with the [Terms and Conditions](/terms), [Privacy Policy](/privacy) and [Payment, Refund and Escrow Policy](/payment-policy). They require Company and qualified legal-counsel review and do not determine worker classification.',
    sections: [
      { title: '1. Profile and account', paragraphs: [
        'Provide truthful information about your skills, experience, availability, portfolio and identity where requested through a supported verification process. Keep your profile current and protect access to your account.',
      ] },
      { title: '2. Project agreement and delivery', paragraphs: [
        'Before work begins, agree with the client on scope, deliverables, milestones, schedule, acceptance criteria, revision limits, dependencies and price. Keep communications and material changes documented. Deliver work on time or promptly explain a delay and agree on a lawful resolution.',
        'The platform’s exact role in forming or enforcing contracts, work review, acceptance, dispute evidence and non-performance remedies must be confirmed by the Company. Do not rely on an interface status as legal advice.',
      ] },
      { title: '3. Payments, fees and withdrawals', paragraphs: [
        'Review the amount, currency, platform fee, payment status and withdrawal quote shown in the applicable platform flow. Funding, release and payout functions may be feature-gated and may depend on provider, currency and account eligibility. A displayed escrow status is not a guarantee of independent custody, release or recovery.',
        'Do not misrepresent completion, request off-platform payment to evade applicable terms, or submit payout details you are not authorized to use. Fees, withdrawal timing, refunds and cancellation treatment require confirmation in the [Payment Policy](/payment-policy).',
      ] },
      { title: '4. Communications, disputes and conduct', paragraphs: [
        'Communicate professionally, preserve relevant project records and raise material scope or payment disagreements through available platform channels. Do not harass, threaten, deceive, infringe third-party rights, misuse client data or engage in unlawful conduct.',
      ] },
      { title: '5. Intellectual property and taxes', paragraphs: [
        'Agree with the client on ownership, licence, permitted reuse and transfer of project materials; use of LEAMJobs alone does not transfer intellectual-property rights. You remain responsible for determining and meeting tax, licensing and regulatory obligations that apply to you.',
      ] },
    ],
  },
  employer: {
    title: 'Employer Terms',
    intro: 'These draft supplemental terms apply to employers using LEAMJobs and should be read with the [Terms and Conditions](/terms), [Privacy Policy](/privacy) and [Payment, Refund and Escrow Policy](/payment-policy). They require Company and qualified legal-counsel review.',
    sections: [
      { title: '1. Employer account and company details', paragraphs: [
        'Use accurate company, contact and account information, maintain appropriate access controls, and provide verification material only through supported platform features. Verification availability is not a guarantee of a company’s conduct, finances or hiring intent.',
      ] },
      { title: '2. Job posts and recruiting', paragraphs: [
        'Post genuine opportunities with accurate responsibilities, requirements, location, compensation information where required, and application instructions. Comply with applicable employment, accessibility, privacy, anti-discrimination and consumer-protection law. Do not publish unlawful, misleading, discriminatory or fictitious listings or ask applicants for prohibited fees.',
        'Use candidate information only for legitimate recruiting and related purposes, limit access to people who need it, and do not unlawfully retain, disclose or reuse it. Retention and deletion requirements must be confirmed in the Privacy Policy.',
      ] },
      { title: '3. Hiring and freelance contracts', paragraphs: [
        'You are responsible for hiring decisions and for complying with applicable employment and contractor-classification rules. When engaging a freelancer, agree scope, deliverables, schedule, price, acceptance criteria, cancellation terms and intellectual-property treatment before work begins.',
      ] },
      { title: '4. Payments, funding and disputes', paragraphs: [
        'Review the amount, currency, fee and payment status before confirming a transaction. Contract funding, escrow release, refunds and withdrawals depend on configured platform features, transaction records, providers and applicable law. A platform escrow status does not itself guarantee independent custody or a particular dispute outcome. See the [Payment Policy](/payment-policy).',
      ] },
      { title: '5. Communication and prohibited conduct', paragraphs: [
        'Communicate honestly and promptly with applicants and contractors. Do not misuse personal data, misrepresent a vacancy, discriminate unlawfully, evade platform safeguards, solicit fraud or use the service for unlawful purposes.',
      ] },
    ],
  },
};

const renderLinks = (copy: string) => copy.split(/(\[[^\]]+\]\([^)]*\))/g).map((part, index) => {
  const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  return match ? <Link key={index} to={match[2]}>{match[1]}</Link> : part;
});

const sectionId = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function LegalPage({ document }: { document: LegalDocument }) {
  const page = documents[document];
  const metadata = legalDocumentMetadata[document];
  return (
    <article className="legal-page">
      <header>
        <span className="legal-page__eyebrow">LEAMJobs · {metadata.status === 'approved' ? 'Approved' : 'Draft for review'}</span>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
        <dl className="legal-page__metadata">
          <div><dt>Version</dt><dd>{metadata.version}</dd></div>
          <div><dt>Last updated</dt><dd>{metadata.lastUpdated}</dd></div>
          {metadata.effectiveDate ? <div><dt>Effective date</dt><dd>{metadata.effectiveDate}</dd></div> : null}
        </dl>
      </header>
      <nav className="legal-page__contents" aria-label={`${page.title} contents`}>
        <h2>Contents</h2>
        <ol>{page.sections.map(({ title }) => <li key={title}><a href={`#${sectionId(title)}`}>{title}</a></li>)}</ol>
      </nav>
      <div className="legal-page__sections">
        {page.sections.map(({ title, paragraphs }) => (
          <section id={sectionId(title)} key={title}>
            <h2>{title}</h2>
            {paragraphs.map((copy) => <p key={copy}>{renderLinks(copy)}</p>)}
          </section>
        ))}
      </div>
      {metadata.status === 'draft' ? (
        <aside className="legal-page__review-note">
          <strong>Draft — not yet approved:</strong> Confirm operational disclosures and obtain qualified legal review before publication or reliance. A draft does not guarantee compliance in every jurisdiction.
        </aside>
      ) : null}
      <p className="legal-page__contact">Questions or privacy requests? Use the existing <Link to="/contact">Contact page</Link>.</p>
    </article>
  );
}

export default LegalPage;
