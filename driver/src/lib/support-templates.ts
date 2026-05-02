export type SupportTemplateKey =
  | "payout_discrepancy"
  | "wrong_deduction"
  | "incentive_missing"
  | "account_blocked"
  | "safety_issue";

export const SUPPORT_TEMPLATES: {
  key: SupportTemplateKey;
  titleHi: string;
  platformHint: string;
  bodyHi: string;
}[] = [
  {
    key: "payout_discrepancy",
    titleHi: "पेआउट कम आया",
    platformHint: "UBER / OLA / RAPIDO",
    bodyHi: `विषय: पेआउट / कमाई में अंतर

मैं आपका रजिस्टर्ड ड्राइवर हूँ। दिनांक ______ को मेरी ______ ट्रिपें थीं, लेकिन बैंक/यूपीआई में ₹______ आए जबकि ऐप के हिसाब से ज़्यादा होना चाहिए था।

कृपया:
1) ट्रिप-वार ब्रेकडाउन
2) हर कटौती का कारण
3) इंसेंटिव नियमों का संदर्भ

धन्यवाद।`,
  },
  {
    key: "wrong_deduction",
    titleHi: "गलत कटौती / adjustment",
    platformHint: "सभी",
    bodyHi: `विषय: अनजान adjustment / कटौती

मेरे खाते से ₹______ की कटौती दिख रही है जिसका कारण समझ में नहीं आया। कृपया विवरण और सुधार बताएँ।

धन्यवाद।`,
  },
  {
    key: "incentive_missing",
    titleHi: "इंसेंटिव नहीं मिला",
    platformHint: "सभी",
    bodyHi: `विषय: इंसेंटिव / बोनस नहीं मिला

______ तारीख के लिए ______ इंसेंटिव पूरा किया था लेकिन भुगतान में शामिल नहीं है। कृपया जाँच करें।

धन्यवाद।`,
  },
  {
    key: "account_blocked",
    titleHi: "अकाउंट / लॉगिन समस्या",
    platformHint: "सभी",
    bodyHi: `विषय: अकाउंट एक्सेस / ब्लॉक

मेरा ड्राइवर अकाउंट ______ समस्या दिखा रहा है। कृपया स्टेटस और अगला कदम बताएँ।

धन्यवाद।`,
  },
  {
    key: "safety_issue",
    titleHi: "सुरक्षा / सवारी विवाद",
    platformHint: "सभी",
    bodyHi: `विषय: सुरक्षा संबंधी घटना

दिनांक ______ को ट्रिप ID ______ के दौरान ______ हुआ। कृपया सहायता और रिकॉर्ड अपडेट करें।

धन्यवाद।`,
  },
];

export function getTemplate(key: SupportTemplateKey) {
  return SUPPORT_TEMPLATES.find((t) => t.key === key);
}
