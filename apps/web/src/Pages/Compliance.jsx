import LegalTemplate from "./LegalTemplate";
// This component renders the case study page using the LegalTemplate component, providing the title, last updated date, introduction, and sections of the case study.
export default function Compliance() {
  return (
    <LegalTemplate
      title="Compliance"
      updated="March 30, 2026"
      intro="ITMS follows recognized best practices to support compliance with applicable regulations and standards."
      sections={[
        {
          heading: "Operational Controls",
          body: [
            "We maintain internal policies to govern data handling and access.",
            "Audit logging is used to support accountability and transparency.",
          ],
        },
        {
          heading: "Data Governance",
          body: [
            "Data is managed according to documented retention and deletion practices.",
          ],
        },
        {
          heading: "Regional Requirements",
          body: [
            "We work with customers to align platform usage with local regulatory needs.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "For compliance questions, contact the ITMS team.",
          ],
        },
      ]}
    />
  );
}