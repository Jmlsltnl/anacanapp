import type { LegalSection } from "./types";

/**
 * Faithful English translation of the Azerbaijani payment-services agreement.
 * The Azerbaijani original prevails in case of discrepancy (see intro note).
 * Part 1: preamble, company details, definitions, sections 1-10.
 */
export const customerTermsEnPart1: LegalSection[] = [
  {
    heading: "AGREEMENT ON THE PROVISION OF PAYMENT SERVICES",
    paragraphs: [
      "This agreement is concluded between \u201cBAKU PAY\u201d Limited Liability Company and the User.",
      "Hereinafter, \u201cBAKU PAY\u201d Limited Liability Company and the User may each be referred to individually as a \u201cParty\u201d and jointly as the \u201cParties\u201d.",
      "By pressing the \u201cConfirm\u201d button to approve this agreement, the User declares their expression of will to conclude the Agreement in accordance with the legislation of the Republic of Azerbaijan.",
      "Note: this English text is a translation provided for convenience. In the event of any discrepancy, the Azerbaijani version of this agreement prevails.",
    ],
  },
  {
    heading: "Information about \u201cBAKU PAY\u201d",
    items: [
      "Name: \u201cBAKU PAY\u201d Limited Liability Company (\u201cBAKU PAY\u201d)",
      "Address: Baku city, Nasimi district, Rashid Behbudov str., house 26, apt. 32",
      "Registration number: 1404036751",
      "Date of state registration: 07.12.2017",
      "License date, number and issuing authority: 15 January 2025, license No. EPT-016, Central Bank of the Republic of Azerbaijan",
      "Phone number: *2021",
    ],
  },
  {
    heading: "Key definitions",
    items: [
      "Authentication \u2014 a procedure enabling \u201cBAKU PAY\u201d LLC to verify the identity of the user or the validity of the use of a payment instrument, including the user's personalized security credentials;",
      "Authorization \u2014 the consent given by the user to \u201cBAKU PAY\u201d LLC for the execution of a payment transaction;",
      "Direct debit \u2014 a payment instrument used to debit the user's payment account based on a payment order of the payee, given the prior consent provided by the User or the payee to \u201cBAKU PAY\u201d LLC;",
      "Blocking \u2014 restriction of access to the payment account or full or partial suspension of the execution of payment transactions in the cases provided for by this agreement, legislation or the internal rules of \u201cBAKU PAY\u201d LLC;",
      "Device \u2014 any mobile phone, tablet or other computing machine that enables the User to use the \u201cPAYONIX\u201d platform;",
      "Electronic money \u2014 a payment instrument issued by \u201cBAKU PAY\u201d LLC and placed at the user's disposal in the amount of the funds received, stored in electronic form, enabling payment transactions and accepted for payment by third parties;",
      "Personalized security credentials \u2014 personalized data provided to the user by \u201cBAKU PAY\u201d LLC for authentication purposes;",
      "Strong customer authentication \u2014 authentication designed to protect the confidentiality of authentication data, based on the use of two or more elements where the breach of one does not compromise the reliability of the others: something only the User knows (password, PIN, a set of questions, etc.), something inherent to the user (face recognition, voice recognition, fingerprint, etc.) and something the user possesses (phone, OTP, TOTP, electronic signature, SIMA, etc.);",
      "User \u2014 a natural person using the payment services provided through the \u201cPAYONIX\u201d Platform. You are considered a user from the moment you press the \u201cConfirm\u201d button to approve this Agreement;",
      "Credit transfer \u2014 a payment instrument used by \u201cBAKU PAY\u201d LLC for the transfer of funds, based on the user's payment order;",
      "Privacy Policy \u2014 the privacy notice published by \u201cBAKU PAY\u201d LLC at https://payonix.com/privacy-policy describing how \u201cBAKU PAY\u201d LLC processes the user's data;",
      "\u201cPAYONIX\u201d platform (\u201cPAYONIX\u201d wallet) \u2014 the software or website, all property and intellectual-property rights to which belong to \u201cBAKU PAY\u201d LLC, through which the user connects via a device and benefits from payment services;",
      "Agreement \u2014 the present agreement on the provision of payment services concluded between \u201cBAKU PAY\u201d LLC and the user, entering into force from the moment the user presses the \u201cConfirm\u201d button on the \u201cPAYONIX\u201d platform;",
      "Payment transaction \u2014 the crediting, transfer or debiting of funds initiated by either the User or the payee, regardless of whether an obligation exists between them;",
      "Refusal to execute a payment transaction \u2014 the refusal by either party to carry out a payment transaction, for example the transfer of funds, crediting to the payment account, refund of funds held in the balance, or other operations;",
      "Payment account \u2014 the account opened by \u201cBAKU PAY\u201d LLC for the User for carrying out payment transactions via the \u201cPAYONIX\u201d Platform;",
      "Payment order \u2014 an instruction given by the User on the \u201cPAYONIX\u201d Platform of \u201cBAKU PAY\u201d LLC for the execution of payment transactions;",
      "Intermediary \u2014 \u201cBAKU PAY\u201d LLC or another payment service provider providing intermediary services for the execution of payment transactions;",
      "Intermediary service for the execution of payment transactions \u2014 the service of submitting a payment order on the user's payment account opened with another payment service provider, at the user's request.",
    ],
  },
  {
    heading: "1. Subject of the Agreement",
    paragraphs: [
      "1.1. This agreement governs the use of the \u201cPAYONIX\u201d Platform, the opening, maintenance and closure of the payment account, the execution of payment transactions, the issuance of electronic money, its use and the refund of the remaining balance, as well as the rules for using other payment services and functionalities provided via the \u201cPAYONIX\u201d Platform.",
      "1.2. Without prejudice to the relevant clauses of this agreement, \u201cBAKU PAY\u201d LLC may provide the user with the following services via the \u201cPAYONIX\u201d Platform:",
    ],
    items: [
      "cash deposit and (or) withdrawal operations on the payment account;",
      "execution of payment transactions by credit transfer, direct debit, payment card or other similar payment instruments;",
      "issuance of payment instruments and (or) acquiring of payment transactions;",
      "money transfer;",
      "issuance of electronic money and execution of payment transactions with electronic money;",
      "intermediary services for the execution of payment transactions;",
      "account information services;",
      "currency exchange;",
      "granting of loans within the limits established by legislation;",
      "provision of other innovative services and products as agreed with the user.",
    ],
  },
  {
    paragraphs: [
      "Note: the terms applicable to the services are published on the Payonix Platform.",
      "1.3. Where \u201cBAKU PAY\u201d LLC, jointly with banks and other payment service providers or independently, issues payment cards to the User within the limits permitted by legislation, the User may use those cards in digital form via the Payonix Platform.",
      "1.4. The User may obtain information about executed payment transactions and the remaining value of electronic money in the payment account via the \u201cPAYONIX\u201d Platform.",
    ],
  },
  {
    heading: "2. Payment account",
    paragraphs: [
      "2.1. For the provision of services, \u201cBAKU PAY\u201d LLC opens a payment account for the user on the \u201cPAYONIX\u201d Platform. By this agreement the User authorizes \u201cBAKU PAY\u201d LLC to open a payment account for them.",
      "2.2. A user who has not completed the identification process is subject to a limit of 300 manats when using the payment services listed in clause 1.2 of this Agreement.",
      "2.3. Specifically, for such a user, the volume of domestic payment transactions per payment instrument within one calendar month and the amount of funds stored on that instrument must not exceed 300 manats or its equivalent in foreign currency.",
      "2.4. Payment instruments not requiring identification may be used only for domestic payment transactions; money transfers may not be executed and funds may not be withdrawn in cash through such instruments. Where established by legislation, the execution of certain payment transactions listed in clause 1.2 of the Agreement may also be unavailable for the said payment instrument.",
      "2.5. Where the User wishes to execute the payment transactions listed in clause 1.2 of this Agreement without any amount limit or usage restriction, they must complete the identification process in accordance with the requirements of legislation. In that case the requirements of clauses 2.2-2.4 of this Agreement shall not apply to that User.",
      "2.6. Taking into account the requirements of applicable legislation, authentication or strong customer authentication may be applied when the payment account is opened, as well as at a later stage when the User accesses the payment account remotely and/or during each payment transaction.",
      "2.7. Storing crypto-assets in the balance of the payment account is prohibited.",
      "2.8. Except where and as permitted by applicable legislation, the payment account may not be used by the user for entrepreneurial purposes.",
      "2.9. \u201cBAKU PAY\u201d LLC may unilaterally deduct the user's debt owed to it from the funds in the balance of the latter's payment account.",
      "2.10. The User may credit funds to the payment account via payment cards, payment terminals or other methods. Information about the payment methods for topping up the payment account balance is published on the \u201cPAYONIX\u201d Platform.",
    ],
  },
  {
    heading: "3. Electronic money",
    paragraphs: [
      "3.1. \u201cBAKU PAY\u201d LLC immediately issues electronic money to the User's payment account in the amount of the funds received from the user for the purpose of issuing electronic money.",
      "3.2. The User understands and accepts that the issuance of electronic money depends on the acceptance of the funds by the bank performing acquiring for the \u201cPAYONIX\u201d Platform.",
      "3.3. In accordance with the requirements of this Agreement and applicable legislation, \u201cBAKU PAY\u201d LLC may unilaterally apply limits to the amount of electronic money stored in the payment account or to transactions, by blocking funds in the balance of the payment account, restricting the amount, number and type of payment transactions, or applying other necessary measures.",
      "3.4. In accordance with the requirements of legislation, \u201cBAKU PAY\u201d LLC safeguards the funds stored in the payment account by holding them in accounts opened with banks operating in the Republic of Azerbaijan or local branches of foreign banks, or guarantees their security by other means. In all cases, guaranteeing the security of the funds is the duty of \u201cBAKU PAY\u201d LLC, and for this purpose it may independently choose any lawful security method permitted by the relevant legislation of the Republic of Azerbaijan.",
      "3.5. Electronic money is not considered a deposit and is not insured; no interest or other form of income is paid on the electronic money held in the user's Payment account on the \u201cPAYONIX\u201d Platform.",
    ],
  },
  {
    heading: "4. Authentication",
    paragraphs: [
      "4.1. \u201cBAKU PAY\u201d LLC may, at its own discretion, authenticate the User in advance of opening the payment account or at any time after the payment account has been opened. The selection of authentication requirements, actions and methodology is within the exclusive competence of \u201cBAKU PAY\u201d LLC, taking into account the requirements of applicable legislation.",
      "4.2. Authentication measures may also be carried out taking into account the amount of funds stored in the payment account and/or the amount and number of payment transactions executed. The first sentence of this clause does not limit the right of \u201cBAKU PAY\u201d LLC to apply authentication measures at any time and for any reason.",
      "4.3. \u201cBAKU PAY\u201d LLC informs the user of the applied authentication measures by publishing information on the \u201cPAYONIX\u201d Platform, by e-mail, SMS notification or otherwise.",
      "4.4. When the balance of the payment account is topped up via the \u201cPAYONIX\u201d Platform, \u201cBAKU PAY\u201d LLC, banks and other payment service providers may apply authentication in accordance with legislation, their own internal rules and considerations. Where such measures are applied by a bank or another payment services organization, the relations regarding authentication or strong customer authentication are governed between the user and that organization, and \u201cBAKU PAY\u201d LLC bears no responsibility for it.",
      "4.5. \u201cBAKU PAY\u201d LLC provides the User with personalized security credentials in order to authenticate them remotely. The User must keep those credentials secure.",
    ],
  },
  {
    heading: "5. The User's duties regarding the payment instrument and personalized security credentials",
    paragraphs: [
      "5.1. If the User discovers that a third party knows their personalized security credentials, they must immediately change those credentials via the \u201cPAYONIX\u201d Platform, and where this is not possible, notify \u201cBAKU PAY\u201d LLC.",
      "5.2. \u201cBAKU PAY\u201d LLC bears no responsibility for the security of the User's device or the mobile phone number linked to the payment account on the \u201cPAYONIX\u201d Platform. If the User's device is lost or stolen, or if the User suspects or discovers any other form of third-party access to their payment account, they must immediately notify \u201cBAKU PAY\u201d LLC in any available form (in writing, electronically, etc.) using the contact details published on its official social media pages.",
      "5.3. The User understands and agrees that they bear full responsibility for the use of their payment account by third parties, regardless of whether consent to access and use was given. \u201cBAKU PAY\u201d LLC bears no responsibility for damage caused to the User as a result of access by authorized or unauthorized persons to the User's payment account in circumstances beyond the control of \u201cBAKU PAY\u201d LLC.",
      "5.4. Where the User fails to secure access to the relevant phone number by obtaining a duplicate SIM card or by other means, \u201cBAKU PAY\u201d LLC bears no obligation to restore the User's access to the payment account and/or the \u201cPAYONIX\u201d Platform.",
    ],
  },
  {
    heading: "6. Payment transactions",
    paragraphs: [
      "6.1. The User may give \u201cBAKU PAY\u201d LLC a payment order for the execution of a payment transaction using the functionalities provided via the \u201cPAYONIX\u201d Platform.",
      "6.2. For each payment transaction, the necessary information is requested from the User via the \u201cPAYONIX\u201d Platform in order to execute the payment order.",
      "6.3. The list of necessary information provided to the User by \u201cBAKU PAY\u201d LLC before the execution of a payment transaction, and the period of its provision, are determined unilaterally by \u201cBAKU PAY\u201d LLC taking into account the requirements of legislation.",
      "6.4. After payment transactions are executed, \u201cBAKU PAY\u201d LLC informs the User. The list of information provided to the User in the notification and the period of its provision are determined unilaterally by \u201cBAKU PAY\u201d LLC taking into account the requirements of legislation.",
      "6.5. Depending on the functionalities of the \u201cPAYONIX\u201d Platform and the services provided by \u201cBAKU PAY\u201d LLC, payment transactions may be executed by credit transfer or direct debit, as well as by other similar payment instruments not prohibited by legislation.",
      "6.6. In a credit transfer, the user bears full responsibility for correctly selecting the payee and, where required, correctly entering their details. \u201cBAKU PAY\u201d LLC bears no responsibility for the User mistakenly selecting the payee or entering incorrect details. Appropriate measures for the refund of funds may be taken by \u201cBAKU PAY\u201d LLC in accordance with the requirements of clause 10.1 of this Agreement.",
      "6.7. Where a payment transaction is executed by direct debit, the User is responsible for correctly identifying the person authorized to issue the payment instruction (payment order) and for the correct issuance of the payment order. For direct debit, \u201cBAKU PAY\u201d LLC obtains the User's consent in advance. In that consent the User must also set the amount limit payable under direct debit. If the amount of a direct-debit payment transaction exceeds the limit set by the User, the User may apply to \u201cBAKU PAY\u201d LLC within 2 months from the date the payment was debited from their payment account; missing the deadline deprives the User of this right. Within 5 business days of receiving such an application, \u201cBAKU PAY\u201d LLC must refund the overpaid amount to the User or inform the User of the reasons for refusal.",
      "6.8. The User may transfer electronic money to other Users and to third parties that accept electronic money as a payment instrument.",
      "6.9. Executing a payment transaction using various graphic representations (for example, QR or barcodes) or by any other non-traditional means does not affect the validity of the payment transaction. In such cases, if the User has been informed in advance that a certain action constitutes an order for the execution of a payment transaction, performing the required action (for example, scanning the QR or barcode) is considered the User's authorization of the payment transaction.",
      "6.10. The execution of the payment transactions provided for in this agreement depends on the functionalities of the \u201cPAYONIX\u201d Platform and the services provided through it. If the \u201cPAYONIX\u201d Platform does not support a certain payment transaction (for example, direct debit), the provisions of this Agreement concerning that type of transaction do not apply. In no case does \u201cBAKU PAY\u201d LLC undertake to provide functionality for the execution of any particular payment transaction.",
    ],
  },
  {
    heading: "7. Submission of the payment order, time of acceptance for execution and execution period",
    paragraphs: [
      "7.1. The User is deemed to have authorized a payment transaction when, during payment operations on the \u201cPAYONIX\u201d Platform, they press a button clearly indicating completion of the operation (for example, \u201cpay\u201d, \u201cmake payment\u201d, \u201ccomplete the operation\u201d, \u201cconfirm\u201d, \u201ctransfer\u201d, etc.).",
      "7.2. Where all conditions established by this Agreement and/or the \u201cPAYONIX\u201d Platform are fulfilled by the User and the payment order is not defective, \u201cBAKU PAY\u201d LLC accepts the authorized payment order for execution.",
      "7.3. Where an authorized payment order is submitted after the end of the operational day, the payment order is deemed accepted for execution on the next operational day.",
      "7.4. \u201cBAKU PAY\u201d LLC executes the payment order no later than the next business day from the moment it accepts the payment order for execution.",
      "7.5. Where the payment transaction is executed by direct debit, \u201cBAKU PAY\u201d LLC ensures the payment order on the date agreed with the user.",
      "7.6. The User accepts that, by agreement with them via the Payonix Platform, and in certain cases as a result of a technical event, the execution of their payment order may be ensured by \u201cBAKU PAY\u201d LLC even where there are insufficient funds in their account (overdraft). In that case, considering that the payment was made at the expense of \u201cBAKU PAY\u201d LLC's funds, the User accepts the obligation to return those funds to \u201cBAKU PAY\u201d LLC within no more than 30 days. Unless a longer period is granted to the User via the Payonix Platform, the User must repay to \u201cBAKU PAY\u201d LLC the funds together with interest on the amount for the benefit derived from the funds (in the manner and within the limits established by legislation).",
      "7.7. The User agrees that, in accordance with clause 7.6 of this agreement, \u201cBAKU PAY\u201d LLC may, at its own discretion, deduct funds not returned within the established period from any of the User's payment accounts known to it.",
    ],
  },
  {
    heading: "8. Refusal of the payment order by the User and withdrawal of the payment order",
    paragraphs: [
      "8.1. The User may refuse a payment order at any time up to the moment defined by clauses 8.2-8.5. As a result of refusing an order issued for the execution of recurring payment transactions, depending on the User's choice, either only the transaction due for execution or all subsequent payment transactions are deemed unauthorized and are not executed.",
      "8.2. The User may not withdraw a payment order sent to a payment system from the moment determined by the rules of the relevant payment system.",
      "8.3. Where the User has agreed with \u201cBAKU PAY\u201d LLC the date of execution of the payment order, the User may withdraw the payment order no later than the end of the business day preceding the agreed date.",
      "8.4. Where the payment transaction is initiated by an intermediary, the User may not withdraw the payment order after consent to initiate the payment transaction has been given to the intermediary.",
      "8.5. Where a direct-debit instrument is used, the User may withdraw the order they issued no later than the end of the business day preceding the day on which the funds are due to be debited from the payment account.",
    ],
  },
  {
    heading: "9. Notification of unauthorized or incorrectly executed payment transactions",
    paragraphs: [
      "9.1. Where the User identifies any unauthorized or incorrectly executed payment transactions, they must immediately notify \u201cBAKU PAY\u201d LLC no later than 6 months after the execution of the payment transaction; otherwise the User forfeits the right to restoration of the amount paid.",
      "9.2. Upon receiving the notification referred to in clause 9.1 from the User, unless \u201cBAKU PAY\u201d LLC proves within 5 business days (or, for transactions executed abroad with payment instruments, within the period defined by the rules of the payment system in which it participates) that the payment transaction was authenticated, correctly recorded, that the amount of the payment transaction was credited to the payment account specified by the User, and that the payment transaction was not affected by a technical failure or another deficiency of \u201cBAKU PAY\u201d LLC, it refunds the User the amount of the payment transaction together with the service fee paid (if applied), within the period established by legislation.",
    ],
  },
  {
    heading: "10. Possibility of refund of funds in case of unjustified debiting from the payment account and erroneous payment orders",
    paragraphs: [
      "10.1. \u201cBAKU PAY\u201d LLC cannot determine or control the directions in which the User's funds are used. Considering this, \u201cBAKU PAY\u201d LLC bears no responsibility for the refund of funds in cases where a payment order was executed on the basis of information incorrectly provided by the User. Nevertheless, where a payment transaction has been executed on the basis of information mistakenly provided by the User, the User may, within 2 months from the day the payment transaction was executed, apply to \u201cBAKU PAY\u201d LLC for the refund of the funds, submitting all supporting documents. Where \u201cBAKU PAY\u201d LLC considers the application justified and the return of the transferred funds is possible, it may refund those funds to the User in compliance with the procedure set out in clause 10.2 of the Agreement.",
      "10.2. Considering clause 10.1 of the Agreement, the User consents that, where funds are credited to their payment account by another User without justification and by mistake, \u201cBAKU PAY\u201d LLC may take certain measures and conduct investigations for the purpose of returning those funds to the other User. In such cases, the User to whose account funds were mistakenly transferred accepts to cooperate with \u201cBAKU PAY\u201d LLC on the return of the funds. Nevertheless, \u201cBAKU PAY\u201d LLC may, on any other basis, debit funds credited to the User's payment account without justification or by mistake from any of their payment accounts without acceptance. By signing this agreement, the user is deemed to have given prior consent to the no-acceptance debiting operation.",
    ],
  },
];
