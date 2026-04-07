import LegalTemplate from "./LegalTemplate";

export default function Terms() {
  return (
    <LegalTemplate
      title="Terms of Service"
      updated="March 30, 2026"
      intro="These Terms of Service govern your access to and use of ITMS. By using the platform, you agree to these terms."
      sections={[
        {
          heading: "Use of Service",
          body: [
            "You may use ITMS only in compliance with applicable laws and regulations.",
            "You are responsible for the activity that occurs under your account and for keeping your access credentials secure.",
          ],
        },
        {
          heading: "Data and Content",
          body: [
            "You retain ownership of your data. By using ITMS, you grant us a limited license to process your data to provide the service.",
            "You represent that you have the rights necessary to provide any data you upload or transmit.",
          ],
        },
        {
          heading: "Availability and Changes",
          body: [
            "We may update, modify, or discontinue features as we improve the platform.",
            "We aim for high availability but do not guarantee uninterrupted service.",
          ],
        },
        {
          heading: "Limitation of Liability",
          body: [
            "ITMS is provided as-is. We are not liable for indirect, incidental, or consequential damages.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "For questions about these terms, contact the ITMS team.",
          ],
        },
      ]}
    />
  );
}



