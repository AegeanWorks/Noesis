import type { ConsentLanguage } from "../storage/researchConsent";

export interface ConsentSection {
  heading: string;
  body: string;
}

export interface ConsentCopy {
  title: string;
  lede: string;
  versionLabel: string;
  agreementHeading: string;
  sections: ConsentSection[];
  checkboxes: string[];
  submit: string;
  cancel: string;
  activeTitle: string;
  activeBody: string;
  staleNotice: string;
  withdrawnNotice: string;
  missingContact: string;
  contactLabel: string;
  notLegal: string;
}

export const RESEARCH_CONSENT_TEXT: Record<ConsentLanguage, ConsentCopy> = {
  en: {
    title: "Informed consent for research data sharing",
    lede:
      "Please read this information before deciding whether to share your practice data with the study team. You can use Noesis without taking part.",
    versionLabel: "Consent version 1",
    agreementHeading: "Your agreement",
    sections: [
      {
        heading: "What this study is about",
        body:
          "The study team wants to learn how people use Noesis and how practice relates to task performance. The data may be used in research articles and reports. The study does not diagnose or treat any medical condition.",
      },
      {
        heading: "What data is included",
        body:
          "Completed sessions: task, level, accuracy, reaction times, durations and dates. Monthly far checks, symptom reports you chose to record, the adaptive-difficulty log, and a random participant code. Symptom reports may contain health-related information; they are included only because you chose to record them. The file does not include your name, email address or account details.",
      },
      {
        heading: "How the data leaves your device",
        body:
          "Nothing is sent automatically. When you choose Send research data, the app downloads a JSON file and prepares an email draft. You must open your email app, attach the file and send it. Your email provider will see your email address.",
      },
      {
        heading: "Voluntary participation",
        body:
          "You can use Noesis without taking part. Refusing or withdrawing has no effect on your practice, scores or access to the app.",
      },
      {
        heading: "Risks and benefits",
        body:
          "The main risk is loss of privacy if the email or file is misdirected. There is no direct benefit to you. The study may help future users and research.",
      },
      {
        heading: "Confidentiality and retention",
        body:
          "The study team replaces your identity with the random participant code. The team is responsible for storing the emailed file securely and for the retention period in the approved protocol. Your local data stays on your device until you delete it.",
      },
      {
        heading: "Withdrawal",
        body:
          "You can withdraw consent in Settings at any time. Future emails stop. Data already sent cannot be recalled, but you can ask the study team to delete it using the contact below.",
      },
      {
        heading: "Contact and ethics",
        body:
          "Study contact: {email}. This consent template must be reviewed by the local ethics committee or IRB before data collection. Noesis is not medical care.",
      },
    ],
    checkboxes: [
      "I have read and understood this information, or it was explained to me.",
      "I agree to share my de-identified practice data with the study team by email.",
      "I understand that the data may be used in research articles and reports.",
      "I understand that participation is voluntary and that I can withdraw at any time; data already sent cannot be recalled.",
      "I am 18 years of age or older.",
    ],
    submit: "Give consent",
    cancel: "Cancel",
    activeTitle: "Consent already given",
    activeBody:
      "You have an active consent record. You can review it here and withdraw it from Settings at any time.",
    staleNotice:
      "The consent text has changed. Please review the current version and give consent again.",
    withdrawnNotice:
      "Your previous consent was withdrawn. You can give consent again with the same participant code.",
    missingContact:
      "The study contact email is not configured. Ask the study team to set it in Settings before giving consent.",
    contactLabel: "Study contact",
    notLegal:
      "This consent template must be reviewed by the local ethics committee or IRB before data collection. Noesis is not medical care.",
  },
  tr: {
    title: "Araştırma Verisi Paylaşımı için Aydınlatılmış Onam",
    lede:
      "Uygulama verilerinizi araştırma ekibiyle paylaşmaya karar vermeden önce bu bilgileri okuyun. Noesis'i katılmadan da kullanabilirsiniz.",
    versionLabel: "Onam sürümü 1",
    agreementHeading: "Onamınız",
    sections: [
      {
        heading: "Bu çalışma ne hakkında",
        body:
          "Araştırma ekibi, insanların Noesis'i nasıl kullandığını ve uygulamanın görev performansıyla ilişkisini öğrenmek istiyor. Veriler araştırma makalelerinde ve raporlarında kullanılabilir. Çalışma herhangi bir tıbbi durumu teşhis etmez veya tedavi etmez.",
      },
      {
        heading: "Hangi veriler yer alıyor",
        body:
          "Tamamlanan oturumlar: görev, seviye, doğruluk, tepki süreleri, süreler ve tarihler. Aylık uzak aktarım kontrolleri, kaydetmeyi seçtiğiniz semptom bildirimleri, uyarlanabilir zorluk günlüğü ve rastgele bir katılımcı kodu. Semptom bildirimleri sağlıkla ilgili bilgiler içerebilir; yalnızca siz kaydetmeyi seçtiğiniz için dahil edilir. Dosyada adınız, e-posta adresiniz veya hesap bilgileriniz yer almaz.",
      },
      {
        heading: "Veriler cihazınızdan nasıl çıkıyor",
        body:
          "Hiçbir şey otomatik gönderilmez. Araştırma verilerini gönder'i seçtiğinizde uygulama bir JSON dosyası indirir ve bir e-posta taslağı hazırlar. E-posta uygulamanızı açıp dosyayı eklemeli ve göndermelisiniz. E-posta sağlayıcınız e-posta adresinizi görür.",
      },
      {
        heading: "Gönüllü katılım",
        body:
          "Noesis'i katılmadan kullanabilirsiniz. Reddetmek veya onamı geri çekmek uygulamanızı, puanlarınızı veya uygulamaya erişiminizi etkilemez.",
      },
      {
        heading: "Riskler ve yararlar",
        body:
          "Başlıca risk, e-postanın veya dosyanın yanlış kişiye gitmesi durumunda gizliliğin kaybıdır. Size doğrudan bir yarar sağlanmaz. Çalışma gelecekteki kullanıcılara ve araştırmaya yardımcı olabilir.",
      },
      {
        heading: "Gizlilik ve saklama",
        body:
          "Araştırma ekibi kimliğinizi rastgele katılımcı koduyla eşleştirir. E-postayla gönderilen dosyayı güvenli saklamak ve onaylı protokoldeki saklama süresine uymak ekibin sorumluluğundadır. Yerel verileriniz siz silene kadar cihazınızda kalır.",
      },
      {
        heading: "Onamı geri çekme",
        body:
          "Onamı istediğiniz zaman Ayarlar'dan geri çekebilirsiniz. Gelecekteki e-postalar durur. Daha önce gönderilen veriler geri çağrılamaz; ancak aşağıdaki iletişim adresini kullanarak araştırma ekibinden silmesini isteyebilirsiniz.",
      },
      {
        heading: "İletişim ve etik",
        body:
          "Çalışma iletişimi: {email}. Bu onam şablonu, veri toplamadan önce yerel etik kurul veya IRB tarafından incelenmelidir. Noesis tıbbi bakım değildir.",
      },
    ],
    checkboxes: [
      "Bu bilgileri okudum ve anladım veya bana açıklandı.",
      "Kimliğim gizlenmiş uygulama verilerimin araştırma ekibiyle e-posta yoluyla paylaşılmasına onam veriyorum.",
      "Verilerin araştırma makalelerinde ve raporlarında kullanılabileceğini anlıyorum.",
      "Katılımın gönüllü olduğunu ve onamı istediğim zaman geri çekebileceğimi; daha önce gönderilen verilerin geri çağrılamayacağını anlıyorum.",
      "18 yaşında veya daha büyük olduğumu beyan ederim.",
    ],
    submit: "Onam ver",
    cancel: "Vazgeç",
    activeTitle: "Onam zaten verildi",
    activeBody:
      "Etkin bir onam kaydınız var. Burada inceleyebilir ve istediğiniz zaman Ayarlar'dan geri çekebilirsiniz.",
    staleNotice:
      "Onam metni değişti. Lütfen güncel sürümü inceleyip yeniden onam verin.",
    withdrawnNotice:
      "Önceki onamınız geri çekildi. Aynı katılımcı koduyla yeniden onam verebilirsiniz.",
    missingContact:
      "Araştırma iletişim e-postası ayarlanmamış. Onam vermeden önce araştırma ekibinden Ayarlar'da bunu ayarlamasını isteyin.",
    contactLabel: "Araştırma iletişimi",
    notLegal:
      "Bu onam şablonu, veri toplamadan önce yerel etik kurul veya IRB tarafından incelenmelidir. Noesis tıbbi bakım değildir.",
  },
};
