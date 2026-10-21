export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  status: 'Sent' | 'Delivered' | 'Pending';
  studentName: string;
  studentId: string;
}

type Listener = (emails: SimulatedEmail[]) => void;

export class ParentNotificationService {
  private static currentWorkspaceId: string = 'diligent';
  private static simulatedEmails: SimulatedEmail[] = (() => {
    try {
      const saved = localStorage.getItem('simulated_emails_diligent') || localStorage.getItem('simulated_emails');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  private static listeners: Listener[] = [];

  static setWorkspaceId(workspaceId: string) {
    if (!workspaceId) return;
    this.currentWorkspaceId = workspaceId;
    try {
      const key = `simulated_emails_${workspaceId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        this.simulatedEmails = JSON.parse(saved);
      } else {
        // Fallback or migration of old global key to diligent if applicable
        if (workspaceId === 'diligent') {
          const oldGlobal = localStorage.getItem('simulated_emails');
          this.simulatedEmails = oldGlobal ? JSON.parse(oldGlobal) : [];
        } else {
          this.simulatedEmails = [];
        }
      }
    } catch {
      this.simulatedEmails = [];
    }
    this.notify();
  }

  static subscribe(listener: Listener) {
    this.listeners.push(listener);
    // Initial emission
    listener([...this.simulatedEmails]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notify() {
    try {
      const key = `simulated_emails_${this.currentWorkspaceId}`;
      localStorage.setItem(key, JSON.stringify(this.simulatedEmails));
    } catch (e) {
      console.error('Failed to save simulated emails', e);
    }
    this.listeners.forEach(l => {
      try {
        l([...this.simulatedEmails]);
      } catch (e) {
        console.error('Listener callback failed in ParentNotificationService', e);
      }
    });
  }

  static getSentEmails(): SimulatedEmail[] {
    return [...this.simulatedEmails];
  }

  static clearInbox() {
    this.simulatedEmails = [];
    this.notify();
  }

  /**
   * Class function to automatically simulate sending a confirmation email to the parent
   * when a student is registered.
   */
  static async sendRegistrationEmail(
    studentName: string,
    studentId: string,
    grade: string,
    section: string,
    parentEmail: string
  ): Promise<SimulatedEmail> {
    const emailData: SimulatedEmail = {
      id: 'MAIL-' + Math.floor(100000 + Math.random() * 900000),
      to: parentEmail.trim().toLowerCase(),
      subject: `📝 የተማሪ ምዝገባ ማረጋገጫ (Student Registration Confirmation) - ${studentName}`,
      body: `ሰላም ጤና ይስጥልን፣\n\nልጅዎ ${studentName} በስማርት ስኩል አፕ በተሳካ ሁኔታ ተመዝግቧል።\n\n📌 የተማሪ መረጃ (Student Information)፡\n• ስም (Name)፡ ${studentName}\n• መለያ ቁጥር (Student ID)፡ ${studentId}\n• ክፍል (Grade)፡ ${grade} - ${section}\n\nወላጅ በዚህ መለያ ቁጥር በመጠቀም በወላጅ ፖርታል (Parent Portal) በመግባት የልጅዎን የትምህርት አፈጻጸም፣ የባህሪ ውጤት (Conduct) እና የክፍል መገኘት (Attendance) በቀላሉ መከታተል ይችላሉ።\n\nደሊጀንት እና ምስጋና፣\nየስማርት ስኩል አፕ አስተዳደር\n\n---\nDear Parent,\n\nYour child ${studentName} has been successfully registered at Smart School App.\n\n📌 Registered Student Information:\n• Name: ${studentName}\n• Student ID: ${studentId}\n• Grade & Section: ${grade} - ${section}\n\nYou can use this Student ID to access the Parent Portal and track your child's grades, conduct, and attendance.\n\nBest regards,\nSmart School App Office`,
      timestamp: new Date().toISOString(),
      status: 'Sent',
      studentName,
      studentId
    };

    // Add to top of the list
    this.simulatedEmails = [emailData, ...this.simulatedEmails];
    this.notify();

    // Simulate network delivery confirmation after 1.5 seconds
    setTimeout(() => {
      const idx = this.simulatedEmails.findIndex(m => m.id === emailData.id);
      if (idx !== -1) {
        this.simulatedEmails[idx] = { ...this.simulatedEmails[idx], status: 'Delivered' };
        this.notify();
      }
    }, 1500);

    return emailData;
  }

  /**
   * Send an automated reminder to parents of students who do not have grades submitted for the current term yet.
   */
  static async sendGradeReminderEmail(
    studentName: string,
    studentId: string,
    grade: string,
    section: string,
    parentEmail: string,
    termName: string,
    missingSubjects: string[],
    schoolName: string
  ): Promise<SimulatedEmail> {
    const subjectsListAmh = missingSubjects.length > 0 ? missingSubjects.join('፣ ') : 'ሁሉም የትምህርት አይነቶች';
    const subjectsListEng = missingSubjects.length > 0 ? missingSubjects.join(', ') : 'All subjects';
    
    const emailData: SimulatedEmail = {
      id: 'MAIL-' + Math.floor(100000 + Math.random() * 900000),
      to: parentEmail.trim().toLowerCase(),
      subject: `⚠️ Grade Submission Reminder - ${studentName}`,
      body: `ሰላም ጤና ይስጥልን፣\n\nይህ ማሳሰቢያ የተላከው ከ${schoolName} ነው። ልጅዎ ${studentName} (${grade} - ${section}) ለ${termName} መመዝገብ የሚገባቸው የትምህርት ውጤቶች ገና ሙሉ በሙሉ አልተጠናቀቁም።\n\n📌 ያልተመዘገቡ የትምህርት አይነቶች (Missing Subjects)፡\n• ${subjectsListAmh}\n\nውጤቶቹ እንደተጠናቀቁ በወላጅ ፖርታል (Parent Portal) ላይ የሚለቀቁ መሆኑን እንገልጻለን። መምህራን ውጤቶቹን በፍጥነት እንዲያጠናቅቁ ርዕሰ መምህሩ ክትትል እያደረጉ ይገኛሉ።\n\nማናቸውም ጥያቄ ካለዎት በትምህርት ቤታችን ስልክ ቁጥር ማነጋገር ይችላሉ።\n\nደሊጀንት እና ምስጋና፣\nየ${schoolName} አስተዳደር\n\n---\nDear Parent,\n\nThis is a reminder from ${schoolName} regarding your child ${studentName} (${grade} - ${section}). The grade submission for ${termName} has not been completed yet for some subjects.\n\n📌 Outstanding/Missing Subjects:\n• ${subjectsListEng}\n\nWe will notify you as soon as the final grade roster is fully approved and released on the Parent Portal. The school administration is actively coordinating with homeroom teachers to expedite this.\n\nFor any inquiries, feel free to contact the school office.\n\nBest regards,\n${schoolName} Administration`,
      timestamp: new Date().toISOString(),
      status: 'Sent',
      studentName,
      studentId
    };

    // Add to top of the list
    this.simulatedEmails = [emailData, ...this.simulatedEmails];
    this.notify();

    // Simulate network delivery confirmation after 1.5 seconds
    setTimeout(() => {
      const idx = this.simulatedEmails.findIndex(m => m.id === emailData.id);
      if (idx !== -1) {
        this.simulatedEmails[idx] = { ...this.simulatedEmails[idx], status: 'Delivered' };
        this.notify();
      }
    }, 1500);

    return emailData;
  }
}
