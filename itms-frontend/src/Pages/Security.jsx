import LegalTemplate from "./LegalTemplate";
// This component renders the Security page using the LegalTemplate component, providing the title, last updated date, introduction, and sections of the security policy.
export default function Security() {
  return (
    <LegalTemplate
      title="Security"
      updated="March 30, 2026"
      intro="We take security seriously and implement measures to protect ITMS data and infrastructure."
      sections={[
        {
          heading: "Infrastructure Protection",
          body: [
            "ITMS uses secure hosting environments with access controls and monitoring.",
            "We apply regular updates and vulnerability patches.",
          ],
        },
        {
          heading: "Data Protection",
          body: [
            "Sensitive data is protected in transit and at rest using industry-standard encryption.",
          ],
        },
        {
          heading: "Access Control",
          body: [
            "Role-based access and least-privilege practices are enforced for internal systems.",
          ],
        },
        {
          heading: "Reporting",
          body: [
            "If you discover a security issue, please contact the ITMS team promptly.",
          ],
        },
      ]}
    />
  );
}