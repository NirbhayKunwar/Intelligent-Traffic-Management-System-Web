import LegalTemplate from "./LegalTemplate";
// This component renders the case study page using the LegalTemplate component, providing the title, last updated date, introduction, and sections of the case study.
export default function CaseStudy() {
  // Case study content
  const title = "Smart Traffic Management System – Case Study";
  // Last updated date
  const updated = "March 2026";
  // Introduction to the case study
  const intro = `This case study presents the design and implementation of an intelligent traffic management system that leverages computer vision, IoT, and cloud technologies to detect accidents, manage congestion, and improve road safety in urban environments. The system integrates real-time monitoring, automated alerts, and scalable infrastructure to enhance traffic efficiency and emergency response.`;
  // Sections of the case study
  const sections = [
    {
      heading: "Problem Statement",
      body: [
        "Urban areas face increasing traffic congestion, delayed emergency response, and lack of real-time monitoring systems.",
        "Traditional traffic systems rely on manual control and lack intelligence to detect accidents or optimize traffic flow dynamically."
      ]
    },
    {
      heading: "Proposed Solution",
      body: [
        "The system uses computer vision models like CNN and YOLO to detect vehicles and accidents from CCTV footage.",
        "A real-time dashboard displays traffic density, incidents, and system performance.",
        "Cloud integration ensures scalability, data storage, and accessibility across multiple locations."
      ]
    },
    {
      heading: "Key Features",
      body: [
        "Computer Vision for vehicle and accident detection.",
        "Real-time dashboard for monitoring traffic conditions.",
        "Automatic incident detection alerts.",
        "Cloud-based infrastructure for scalability and reliability."
      ]
    },
    {
      heading: "Methodology",
      body: [
        "CCTV video frames are processed using deep learning models like CNN and LSTM to analyze spatial and temporal patterns.",
        "YOLO-based models are used for real-time object detection.",
        "Data is transmitted to cloud platforms for visualization and control."
      ]
    },
    {
      heading: "Related Work",
      body: [
        "Previous systems have used IoT sensors, fuzzy logic, and load-based detection for traffic management.",
        "Research shows that combining CNN and LSTM improves accident detection accuracy by analyzing both spatial and temporal data.",
        "YOLO-based systems provide real-time performance suitable for smart city applications."
      ]
    },
    {
      heading: "Results and Impact",
      body: [
        "Improved traffic flow and reduced congestion.",
        "Faster emergency response through automatic alerts.",
        "Enhanced road safety using intelligent monitoring.",
        "Scalable and cost-effective solution using existing CCTV infrastructure."
      ]
    },
    {
      heading: "Future Scope",
      body: [
        "Integration with smart traffic signals for dynamic control.",
        "Use of advanced models like GANs and Graph Neural Networks.",
        "Expansion to smart city ecosystems with IoT and edge computing.",
        "Mobile applications for real-time user notifications."
      ]
    }
  ];
  // Render the case study using the LegalTemplate component
  return (
    <LegalTemplate
      title={title}
      updated={updated}
      intro={intro}
      sections={sections}
    />
  );
}