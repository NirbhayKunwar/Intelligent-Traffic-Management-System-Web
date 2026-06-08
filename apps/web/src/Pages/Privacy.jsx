import LegalTemplate from "./LegalTemplate";
// This component renders the Privacy Policy page using the LegalTemplate component, providing the title, last updated date, introduction, and sections of the privacy policy.
export default function Privacy() {
  return (
    <LegalTemplate
      title="Privacy Policy"
      updated="March 30, 2026"
      intro="This Privacy Policy explains how ITMS collects, uses, and protects information when you use our platform."
      sections={[
        {
          heading: "Information We Collect",
          body: [
            "Account details such as name, email, and organization.",
            "Operational data necessary to provide analytics and system insights.",
          ],
        },
        {
          heading: "How We Use Information",
          body: [
            "To operate, maintain, and improve ITMS services.",
            "To communicate service updates and security notices.",
          ],
        },
        {
          heading: "Data Retention",
          body: [
            "We retain data only as long as necessary to provide the service and meet legal obligations.",
          ],
        },
        {
          heading: "Your Choices",
          body: [
            "You can request access, correction, or deletion of your account data.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "For privacy inquiries, contact the ITMS team.",
          ],
        },
      ]}
    />
  );
}