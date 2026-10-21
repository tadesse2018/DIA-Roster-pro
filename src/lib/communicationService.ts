export interface CommunicationReply {
  id: string;
  senderRole: 'principal' | 'teacher' | 'assistant_teacher' | 'parent';
  senderName: string;
  senderContact: string;
  message: string;
  timestamp: string;
}

export interface CommunicationMessage {
  id: string;
  title: string;
  content: string;
  senderRole: 'principal' | 'teacher' | 'assistant_teacher' | 'parent';
  senderName: string;
  senderContact: string; // phone or email
  senderSubject?: string; // e.g., 'ሒሳብ (Mathematics)', 'እንግሊዝኛ (English)', 'ዋና መምህር', 'ረዳት መምህር'
  grade: string; // e.g. 'Grade 1'
  section: string; // e.g. 'A'
  targetType: 'all' | 'selected'; // 'all' = whole class broadcast, 'selected' = chosen student parents
  targetStudentIds: string[]; // e.g. ['ID-4021', 'ID-4022']
  targetStudentNames?: string[]; // e.g. ['አበበ ከበደ', 'ቤተልሔም ደስታ']
  targetParentPhones?: string[]; // e.g. ['0911012345']
  studentId?: string; // If sent by a parent or specifically focused on one student
  studentName?: string;
  replies: CommunicationReply[];
  readByParent: boolean;
  readByStaff: boolean;
  createdAt: string;
  workspaceId: string;
}

type CommunicationListener = (messages: CommunicationMessage[]) => void;

export class CommunicationService {
  private static currentWorkspaceId: string = 'diligent';
  private static listeners: CommunicationListener[] = [];

  private static getInitialSampleMessages(workspaceId: string): CommunicationMessage[] {
    return [
      {
        id: 'COMM-1001',
        title: 'ስለ ተማሪው የቤት ስራ አፈጻጸም እና የንባብ ክትትል (Reading & Homework Progress)',
        content: 'ሰላም የተከበሩ ወላጅ፤ ተማሪ አበበ ከበደ በዚህ ሳምንት በሒሳብ እና በእንግሊዝኛ ትምህርት የቤት ስራውን በታላቅ ትጋት ሰርቷል። በቀጣይ በንባብ ክህሎቱ ላይ ተጨማሪ የ15 ደቂቃ የቤት ውስጥ ድጋፍ እንዲያደርጉለት በትህትና እንጠይቃለን።',
        senderRole: 'teacher',
        senderName: 'መምህር አለሙ በቀለ (የክፍል ተጠሪ)',
        senderContact: '0912345678',
        senderSubject: 'የክፍል ተጠሪ / ሒሳብ',
        grade: 'Grade 1',
        section: 'A',
        targetType: 'selected',
        targetStudentIds: ['ID-4021'],
        targetStudentNames: ['አበበ ከበደ (Abebe Kebede)'],
        targetParentPhones: ['0911012345', '0922334455'],
        studentId: 'ID-4021',
        studentName: 'አበበ ከበደ (Abebe Kebede)',
        replies: [
          {
            id: 'REP-1',
            senderRole: 'parent',
            senderName: 'የአበበ ወላጅ (Parent of Abebe)',
            senderContact: '0911012345',
            message: 'ሰላም መምህር አለሙ፤ ስለተሰጠው ግብረ-መልስ እና ክትትል ከልብ እናመሰግናለን። በየዕለቱ ከእራት በኋላ የንባብ ልምምድ እያደረግን እንቀጥላለን።',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
          },
          {
            id: 'REP-2',
            senderRole: 'teacher',
            senderName: 'መምህር አለሙ በቀለ',
            senderContact: '0912345678',
            message: 'እጅግ በጣም መልካም ትብብር ነው፤ በርቱ!',
            timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
          }
        ],
        readByParent: true,
        readByStaff: true,
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        workspaceId
      },
      {
        id: 'COMM-1002',
        title: 'የመጀመሪያ ወሰነ-ትምህርት የወላጆች እና መምህራን የጋራ የምክክር መድረክ ጥሪ',
        content: 'ውድ የGrade 1 - Section A ወላጆች በሙሉ፤ በመጪው ቅዳሜ ከጠዋቱ 3:00 ጀምሮ የልጆቻችሁን የትምህርት አቀባበል እና የክፍል ውስጥ ተሳትፎ አስመልክቶ ከዋና መምህሩ እና ከክፍል አላፊ መምህራን ጋር የጋራ ውይይት ስላለ በሰዓቱ እንድትገኙ በአክብሮት ተጠርታችኋል።',
        senderRole: 'principal',
        senderName: 'ዶ/ር ሙሉጌታ ተስፋዬ (ዋና መምህር / Principal)',
        senderContact: '0911223344',
        senderSubject: 'ዋና መምህር / ርዕሰ መምህር',
        grade: 'Grade 1',
        section: 'A',
        targetType: 'all',
        targetStudentIds: [],
        targetStudentNames: ['ለሁሉም የክፍሉ ተማሪዎች ወላጆች (All Grade 1-A Parents)'],
        targetParentPhones: [],
        replies: [
          {
            id: 'REP-3',
            senderRole: 'parent',
            senderName: 'የቤተልሔም ደስታ ወላጅ',
            senderContact: '0912345678',
            message: 'ጥሪውን ተቀብለናል፤ በሰዓቱ እንገኛለን። እናመሰግናለን!',
            timestamp: new Date(Date.now() - 3600000 * 6).toISOString()
          }
        ],
        readByParent: false,
        readByStaff: true,
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        workspaceId
      },
      {
        id: 'COMM-1003',
        title: 'የትምህርት መርጃ መሳሪያዎች እና የአርት ቁሳቁሶች ማስታወሻ',
        content: 'ውድ ወላጆች፤ ለነገው የስዕል እና የዕደ-ጥበብ ክፍለ-ጊዜ ልጆቻችሁ ከለር እርሳስና መቀስ ይዘው እንዲመጡ ይደረግ። ረዳት መምህሯ በክፍል ውስጥ አስፈላጊውን የቅርብ እገዛ ታደርግላቸዋለች።',
        senderRole: 'assistant_teacher',
        senderName: 'ረዳት መምህርት ሰላማዊት አበራ (Assistant Teacher)',
        senderContact: '0915678901',
        senderSubject: 'ረዳት መምህር / ዕደ-ጥበብ',
        grade: 'Grade 1',
        section: 'A',
        targetType: 'all',
        targetStudentIds: [],
        targetStudentNames: ['የክፍሉ ተማሪዎች ወላጆች'],
        targetParentPhones: [],
        replies: [],
        readByParent: false,
        readByStaff: true,
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        workspaceId
      }
    ];
  }

  static setWorkspaceId(workspaceId: string) {
    if (!workspaceId) return;
    this.currentWorkspaceId = workspaceId;
    this.notify();
  }

  private static getStorageKey(workspaceId?: string): string {
    const ws = workspaceId || this.currentWorkspaceId || 'diligent';
    return `school_communications_${ws}`;
  }

  static getMessages(workspaceId?: string): CommunicationMessage[] {
    const key = this.getStorageKey(workspaceId);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse communications from localStorage:', e);
    }
    const initial = this.getInitialSampleMessages(workspaceId || this.currentWorkspaceId || 'diligent');
    try {
      localStorage.setItem(key, JSON.stringify(initial));
    } catch {}
    return initial;
  }

  static saveMessages(messages: CommunicationMessage[], workspaceId?: string) {
    const key = this.getStorageKey(workspaceId);
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save communications:', e);
    }
    this.notify();
  }

  static subscribe(listener: CommunicationListener) {
    this.listeners.push(listener);
    // Initial emit
    listener(this.getMessages());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notify() {
    const messages = this.getMessages();
    this.listeners.forEach(l => {
      try {
        l(messages);
      } catch (e) {
        console.error('Listener callback failed in CommunicationService:', e);
      }
    });
  }

  static sendMessage(
    msg: Omit<CommunicationMessage, 'id' | 'createdAt' | 'replies' | 'readByParent' | 'readByStaff'>,
    workspaceId?: string
  ): CommunicationMessage {
    const current = this.getMessages(workspaceId);
    const newMsg: CommunicationMessage = {
      ...msg,
      id: `COMM-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      replies: [],
      readByParent: msg.senderRole === 'parent',
      readByStaff: msg.senderRole !== 'parent',
      workspaceId: workspaceId || this.currentWorkspaceId || 'diligent'
    };
    const updated = [newMsg, ...current];
    this.saveMessages(updated, workspaceId);
    return newMsg;
  }

  static addReply(
    messageId: string,
    reply: Omit<CommunicationReply, 'id' | 'timestamp'>,
    workspaceId?: string
  ): boolean {
    const current = this.getMessages(workspaceId);
    const index = current.findIndex(m => m.id === messageId);
    if (index === -1) return false;

    const newReply: CommunicationReply = {
      ...reply,
      id: `REP-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString()
    };

    const targetMsg = current[index];
    const updatedMsg: CommunicationMessage = {
      ...targetMsg,
      replies: [...(targetMsg.replies || []), newReply],
      readByParent: reply.senderRole === 'parent' ? targetMsg.readByParent : false,
      readByStaff: reply.senderRole !== 'parent' ? targetMsg.readByStaff : false
    };

    current[index] = updatedMsg;
    this.saveMessages([...current], workspaceId);
    return true;
  }

  static markAsRead(messageId: string, asRole: 'parent' | 'staff', workspaceId?: string) {
    const current = this.getMessages(workspaceId);
    const index = current.findIndex(m => m.id === messageId);
    if (index === -1) return;

    if (asRole === 'parent') {
      current[index].readByParent = true;
    } else {
      current[index].readByStaff = true;
    }
    this.saveMessages([...current], workspaceId);
  }

  static deleteMessage(messageId: string, workspaceId?: string): boolean {
    const current = this.getMessages(workspaceId);
    const filtered = current.filter(m => m.id !== messageId);
    this.saveMessages(filtered, workspaceId);
    return true;
  }
}
