import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    padding: 40,
    lineHeight: 1.6,
    color: '#333',
  },
  header: {
    marginBottom: 30,
  },
  name: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  contactInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    marginBottom: 30,
  },
  company: {
    fontSize: 12,
    marginBottom: 30,
  },
  subject: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 12,
    marginBottom: 20,
  },
  body: {
    marginBottom: 30,
  },
  paragraph: {
    fontSize: 12,
    marginBottom: 15,
    textAlign: 'justify',
  },
  bulletPoint: {
    fontSize: 12,
    marginBottom: 5,
    marginLeft: 20,
  },
  closing: {
    fontSize: 12,
    marginBottom: 20,
  },
  signature: {
    fontSize: 12,
  },
});

interface LetterProps {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    portfolio?: string;
  };
  date: string;
  company: string;
  position: string;
  subject: string;
  greeting: string;
  bodyParagraphs: string;
  closing: string;
  signature: string;
}

export const LetterTemplate = ({
  personalInfo,
  date,
  company,
  position,
  subject,
  greeting,
  bodyParagraphs,
  closing,
  signature,
}: LetterProps) => {
  // Extract domain from portfolio URL
  const getPortfolioDomain = (portfolio?: string) => {
    if (!portfolio) return '';
    try {
      const url = portfolio.startsWith('http') ? portfolio : `https://${portfolio}`;
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return portfolio;
    }
  };

  // Process body paragraphs and handle bullet points
  const processBodyContent = () => {
    const paragraphs = bodyParagraphs.split('\n\n').filter(p => p.trim());
    const elements: JSX.Element[] = [];

    paragraphs.forEach((paragraph, index) => {
      if (paragraph.includes('•')) {
        // Handle bullet points
        const lines = paragraph.split('\n');
        lines.forEach((line, lineIndex) => {
          if (line.trim()) {
            if (line.trim().startsWith('•')) {
              elements.push(
                <Text key={`${index}-${lineIndex}`} style={styles.bulletPoint}>
                  {line.trim()}
                </Text>
              );
            } else {
              elements.push(
                <Text key={`${index}-${lineIndex}`} style={styles.paragraph}>
                  {line.trim()}
                </Text>
              );
            }
          }
        });
      } else {
        // Regular paragraph
        elements.push(
          <Text key={index} style={styles.paragraph}>
            {paragraph.trim()}
          </Text>
        );
      }
    });

    return elements;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.name}</Text>
          <Text style={styles.contactInfo}>{personalInfo.email}</Text>
          {personalInfo.phone && (
            <Text style={styles.contactInfo}>{personalInfo.phone}</Text>
          )}
          {getPortfolioDomain(personalInfo.portfolio) && (
            <Text style={styles.contactInfo}>
              {getPortfolioDomain(personalInfo.portfolio)}
            </Text>
          )}
        </View>

        {/* Date */}
        <Text style={styles.date}>{date}</Text>

        {/* Company */}
        <Text style={styles.company}>{company}</Text>

        {/* Subject */}
        <Text style={styles.subject}>Subject: {subject}</Text>

        {/* Greeting */}
        <Text style={styles.greeting}>{greeting}</Text>

        {/* Body */}
        <View style={styles.body}>
          {processBodyContent()}
        </View>

        {/* Closing */}
        <Text style={styles.closing}>{closing}</Text>

        {/* Signature */}
        <Text style={styles.signature}>{signature}</Text>
      </Page>
    </Document>
  );
}; 