// components/ChatBot.js
import { useState, useRef, useEffect } from "react";
import Base_url from "./Base_url";
import { translate } from "../utils/translate";

const CHAT_STATE = {
  LANGUAGE: "LANGUAGE",
  MENU: "MENU",
  CREATE_SERVICE: "CREATE_SERVICE",
  CREATE_TYPE: "CREATE_TYPE",
  CREATE_TEXT: "CREATE_TEXT",
  CREATE_DATE: "CREATE_DATE",
  CREATE_CITY: "CREATE_CITY",
  CREATE_PINCODE: "CREATE_PINCODE",
  CREATE_TRACKING: "CREATE_TRACKING",
  CREATE_EMAIL: "CREATE_EMAIL",
  CREATE_CONFIRM: "CREATE_CONFIRM",
  TRACK: "TRACK",
  TRACK_ID: "TRACK_ID",
  TRACK_EMAIL: "TRACK_EMAIL",
  TRACK_OTP: "TRACK_OTP",
  CREATE_OTP: "CREATE_OTP",
  CREATE_SUCCESS: "CREATE_SUCCESS",
};

// Language-specific placeholders
const PLACEHOLDERS = {
  en: "Type your message...",
  hi: "अपना संदेश टाइप करें...",
  te: "మీ సందేశాన్ని టైప్ చేయండి...",
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatState, setChatState] = useState(CHAT_STATE.LANGUAGE);
  const [language, setLanguage] = useState("en");
  const [input, setInput] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(null);

  const [complaintData, setComplaintData] = useState({
    service_type: "",
    complaint_type: "",
    complaint_text: "",
    incident_date: "",
    city: "",
    pincode: "",
    tracking_number: "",
    email: "",
  });

  // START WITH ONLY LANGUAGE SELECTION
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "🌍 Please select your language:",
      options: [
        { label: "English", value: "en" },
        { label: "हिन्दी", value: "hi" },
        { label: "తెలుగు", value: "te" },
      ],
      key: 1,
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Add bot message with translation
  const addBotMessage = async (text, options = null) => {
    const key = Date.now();
    const tempKey = `temp-${key}`;

    // If we're already translating, wait for it to finish
    if (isTranslating) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Only show "Translating..." for non-English
    if (language !== "en" && hasSelectedLanguage) {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Translating...",
          key: tempKey,
          isTranslating: true,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: text,
          options: options,
          key: key,
        },
      ]);
      return;
    }

    try {
      setIsTranslating(true);

      let translatedText = text;
      let translatedOptions = options;

      if (language !== "en" && hasSelectedLanguage) {
        translatedText = await translate(text, language);

        if (options) {
          translatedOptions = await Promise.all(
            options.map(async (opt) => ({
              ...opt,
              label: await translate(opt.label, language),
            }))
          );
        }
      }

      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.key !== tempKey);
        const messageExists = filtered.some(
          (msg) => msg.text === translatedText || msg.key === key
        );

        if (!messageExists) {
          return [
            ...filtered,
            {
              from: "bot",
              text: translatedText,
              options: translatedOptions,
              key: key,
            },
          ];
        }
        return filtered;
      });
    } catch (error) {
      console.error("Translation failed:", error);
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.key !== tempKey);
        const messageExists = filtered.some(
          (msg) => msg.text === text || msg.key === key
        );

        if (!messageExists) {
          return [
            ...filtered,
            {
              from: "bot",
              text: text,
              options: options,
              key: key,
            },
          ];
        }
        return filtered;
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        from: "user",
        text: text,
        key: Date.now(),
      },
    ]);
  };

  const handleOptionClick = async (option) => {
    if (isTranslating) return;

    const now = Date.now();
    if (lastClickTime && now - lastClickTime < 500) return;
    setLastClickTime(now);

    addUserMessage(option.label);

    switch (chatState) {
      case CHAT_STATE.LANGUAGE:
        const selectedLang = option.value;
        setLanguage(selectedLang);
        setHasSelectedLanguage(true);
        setChatState(CHAT_STATE.MENU);

        const welcomeText = "👋 Welcome to India Post Support";
        let translatedWelcome = welcomeText;

        if (selectedLang !== "en") {
          setIsTranslating(true);
          try {
            translatedWelcome = await translate(welcomeText, selectedLang);
          } catch (error) {
            console.error("Failed to translate welcome:", error);
          } finally {
            setIsTranslating(false);
          }
        }

        setMessages((prev) => {
          const hasWelcome = prev.some(
            (msg) =>
              msg.text.includes("Welcome") || msg.text.includes("స్వాగతం")
          );

          if (!hasWelcome) {
            return [
              ...prev,
              {
                from: "bot",
                text: translatedWelcome,
                key: Date.now(),
              },
            ];
          }
          return prev;
        });

        await addBotMessage("What would you like to do?", [
          { label: "📄 Register Complaint", value: "CREATE" },
          { label: "🔍 Track Complaint", value: "TRACK" },
        ]);
        break;

      case CHAT_STATE.MENU:
        if (option.value === "CREATE") {
          startCreateFlow();
        } else if (option.value === "TRACK") {
          setChatState(CHAT_STATE.TRACK_ID);
          await addBotMessage("🔍 Please enter your Complaint ID:");
        }
        break;

      case CHAT_STATE.CREATE_SERVICE:
        setComplaintData((p) => ({ ...p, service_type: option.value }));
        setChatState(CHAT_STATE.CREATE_TYPE);
        await addBotMessage("Select issue type:", [
          { label: "🚚 Delay in delivery", value: "Delay in delivery" },
          { label: "❓ Lost / Non-delivery", value: "Lost / Non-delivery" },
          { label: "⚠️ Wrong delivery", value: "Wrong delivery" },
          { label: "😊 Staff behavior", value: "Staff behavior" },
          { label: "💰 Refund / Payment issue", value: "Refund / Payment issue" },
          { label: "📋 Other", value: "Other" },
        ]);
        break;

      case CHAT_STATE.CREATE_TYPE:
        setComplaintData((p) => ({ ...p, complaint_type: option.value }));
        setChatState(CHAT_STATE.CREATE_TEXT);
        await addBotMessage("📝 Please describe your issue in detail (minimum 20 characters):");
        break;

      case CHAT_STATE.CREATE_CONFIRM:
        if (option.value === "CONFIRM") {
          sendCreateOtp();
        } else {
          resetChat();
        }
        break;

      case CHAT_STATE.TRACK:
      case CHAT_STATE.TRACK_OTP:
        if (option.value === "MENU") {
          setChatState(CHAT_STATE.MENU);
          await addBotMessage("What would you like to do?", [
            { label: "📄 Register Complaint", value: "CREATE" },
            { label: "🔍 Track Complaint", value: "TRACK" },
          ]);
        }
        break;

      default:
        break;
    }
  };

  const handleUserInput = async () => {
    if (!input.trim()) return;

    const userInput = input;
    addUserMessage(userInput);
    setInput("");

    switch (chatState) {
      case CHAT_STATE.CREATE_TEXT:
        if (userInput.length < 20) {
          await addBotMessage("Please provide more details (minimum 20 characters) for better assistance:");
          return;
        }
        setComplaintData((p) => ({ ...p, complaint_text: userInput }));
        setChatState(CHAT_STATE.CREATE_DATE);
        await addBotMessage("📅 When did this happen? (YYYY-MM-DD):");
        break;

      case CHAT_STATE.CREATE_DATE:
        setComplaintData((p) => ({ ...p, incident_date: userInput }));
        setChatState(CHAT_STATE.CREATE_CITY);
        await addBotMessage("🏙️ Enter your city:");
        break;

      case CHAT_STATE.CREATE_CITY:
        setComplaintData((p) => ({ ...p, city: userInput }));
        setChatState(CHAT_STATE.CREATE_PINCODE);
        await addBotMessage("📮 Enter 6-digit pincode:");
        break;

      case CHAT_STATE.CREATE_PINCODE:
        setComplaintData((p) => ({ ...p, pincode: userInput }));
        setChatState(CHAT_STATE.CREATE_TRACKING);
        await addBotMessage("📦 Tracking number (if available, otherwise type 'NA'):");
        break;

      case CHAT_STATE.TRACK_ID:
        setComplaintData((p) => ({ ...p, complaint_id: userInput }));
        setChatState(CHAT_STATE.TRACK_EMAIL);
        await addBotMessage("📧 Enter your registered email:");
        break;

      case CHAT_STATE.CREATE_OTP:
        verifyCreateOtp(userInput);
        break;

      case CHAT_STATE.TRACK_EMAIL:
        setComplaintData((p) => ({ ...p, email: userInput }));
        sendTrackingOtp(userInput, complaintData.complaint_id);
        setChatState(CHAT_STATE.TRACK_OTP);
        await addBotMessage("✅ OTP sent to your email. Please check and enter the 6-digit OTP:");
        break;

      case CHAT_STATE.TRACK_OTP:
        verifyTrackingOtp(userInput);
        break;

      case CHAT_STATE.CREATE_TRACKING:
        setComplaintData((p) => ({ ...p, tracking_number: userInput }));
        setChatState(CHAT_STATE.CREATE_EMAIL);
        await addBotMessage("📧 Enter your email for updates and OTP:");
        break;

      case CHAT_STATE.CREATE_EMAIL:
        setComplaintData((p) => ({ ...p, email: userInput }));
        setChatState(CHAT_STATE.CREATE_CONFIRM);
        await showConfirmation();
        break;

      default:
        break;
    }
  };

  const startCreateFlow = async () => {
    setComplaintData({
      service_type: "",
      complaint_type: "",
      complaint_text: "",
      incident_date: "",
      city: "",
      pincode: "",
      tracking_number: "",
      email: "",
    });
    setChatState(CHAT_STATE.CREATE_SERVICE);
    await addBotMessage("📦 Select service type:", [
      { label: "🚀 Speed Post", value: "Speed Post" },
      { label: "📮 Registered Post", value: "Registered Post" },
      { label: "📦 Parcel", value: "Parcel" },
      { label: "💰 Money Order", value: "Money Order" },
      { label: "📋 Other", value: "Other" },
    ]);
  };

  const showConfirmation = async () => {
    const text =
      `✅ **Please Review Your Complaint**\n\n` +
      `📦 **Service Type:** ${complaintData.service_type}\n` +
      `⚠️ **Issue:** ${complaintData.complaint_type}\n` +
      `🏙️ **City:** ${complaintData.city}\n` +
      `📧 **Email:** ${complaintData.email}\n\n` +
      `All details correct?`;

    await addBotMessage(text, [
      { label: "✅ Yes, Submit Complaint", value: "CONFIRM" },
      { label: "❌ No, Start Over", value: "CANCEL" },
    ]);
  };

  const resetChat = async () => {
    setMessages([
      {
        from: "bot",
        text: "🌍 Please select your language:",
        options: [
          { label: "English", value: "en" },
          { label: "हिन्दी", value: "hi" },
          { label: "తెలుగు", value: "te" },
        ],
        key: 1,
      },
    ]);
    setChatState(CHAT_STATE.LANGUAGE);
    setHasSelectedLanguage(false);
    setLanguage("en");
  };

  const sendCreateOtp = async () => {
    try {
      await addBotMessage("📧 Sending OTP to your email...");

      const response = await fetch(`${Base_url}/registration/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: complaintData.email }),
      });

      if (!response.ok) throw new Error("Failed to send OTP");

      setChatState(CHAT_STATE.CREATE_OTP);
      await addBotMessage(
        "🔐 Please enter the 6-digit OTP sent to your email:"
      );
    } catch (err) {
      await addBotMessage("❌ Failed to send OTP. Please try again.");
      setChatState(CHAT_STATE.MENU);
    }
  };

  const sendTrackingOtp = async (email, complaintId) => {
    try {
      await fetch(`${Base_url}/otp/tracking/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, complaintId }),
      });
    } catch (err) {
      console.error("Send OTP error:", err);
    }
  };

  const verifyTrackingOtp = async (otp) => {
    try {
      const verifyRes = await fetch(`${Base_url}/otp/tracking/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: complaintData.email,
          complaintId: complaintData.complaint_id,
          otp,
        }),
      });

      if (!verifyRes.ok) throw new Error("OTP verification failed");

      const complaintRes = await fetch(
        `${Base_url}/complaints/${complaintData.complaint_id}`
      );
      if (!complaintRes.ok) throw new Error("Complaint not found");

      const complaint = await complaintRes.json();
      await showTrackingResult(complaint);
    } catch (err) {
      await addBotMessage("❌ Invalid OTP or complaint not found.");
    }
  };

  const verifyCreateOtp = async (otp) => {
    try {
      await addBotMessage("⏳ Verifying OTP and submitting your complaint...");

      const res = await fetch(`${Base_url}/registration/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: complaintData.email,
          otp,
          complaintData: {
            service_type: complaintData.service_type,
            complaint_type: complaintData.complaint_type,
            complaint_text: complaintData.complaint_text,
            tracking_number: complaintData.tracking_number,
            incident_date: complaintData.incident_date,
            city: complaintData.city,
            pincode: complaintData.pincode,
          },
        }),
      });

      if (!res.ok) throw new Error("OTP verification failed");

      const data = await res.json();
      await showCreateSuccess(data.complaintId);
    } catch (err) {
      await addBotMessage("❌ Invalid OTP. Please try again.");
    }
  };

  const showTrackingResult = async (complaint) => {
    const statusEmoji = {
      "Under Review": "🟡",
      "In Progress": "🔄",
      "Resolved": "✅",
      "Closed": "🔒",
    }[complaint.status] || "📋";

    const text =
      `📄 **Complaint Details**\n\n` +
      `🆔 **ID:** ${complaint.complaint_id}\n` +
      `${statusEmoji} **Status:** ${complaint.status}\n` +
      `📦 **Service:** ${complaint.service_type}\n` +
      `⚠️ **Issue:** ${complaint.complaint_type}\n` +
      `⏰ **Priority:** ${complaint.priority_level}\n\n` +
      `📝 **Latest Update:**\n` +
      `"${complaint.auto_response || "Your complaint is being reviewed by our team."}"`;

    await addBotMessage(text, [{ label: "🏠 Back to Menu", value: "MENU" }]);
    setChatState(CHAT_STATE.MENU);
  };

  const showCreateSuccess = async (complaintId) => {
    const successText =
      `🎉 **Complaint Registered Successfully!**\n\n` +
      `✅ **Complaint ID:** **${complaintId}**\n\n` +
      `📧 A confirmation email has been sent to your registered email address.\n\n` +
      `⏰ **What happens next?**\n` +
      `• Our team will review your complaint\n` +
      `• You'll receive updates via email\n` +
      `• Most issues are resolved within 24-48 hours\n\n` +
      `🔍 **Keep your Complaint ID safe** to track the status anytime.\n\n` +
      `Thank you for helping us improve our service! 🙏`;

    await addBotMessage(successText, [
      { label: "🔍 Track This Complaint", value: "TRACK" },
      { label: "🏠 Main Menu", value: "MENU" },
    ]);
    setChatState(CHAT_STATE.MENU);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white text-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 z-50 flex items-center justify-center"
      >
        💬
      </button>

      {isOpen && (
        <div className="fixed bottom-28 right-6 w-[380px] bg-white rounded-xl shadow-2xl flex flex-col border border-red-200 z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                📮
              </div>
              <span className="font-bold">
                {hasSelectedLanguage ? "India Post Assistant" : "Select Language"}
              </span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                if (!hasSelectedLanguage) {
                  resetChat();
                }
              }}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors text-lg"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-red-50 to-white space-y-4 max-h-[400px]">
            {messages.map((m) => (
              <div key={m.key}>
                <div
                  className={`flex ${
                    m.from === "bot" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm max-w-[85%] ${
                      m.from === "bot"
                        ? "bg-white border border-red-100 shadow-sm"
                        : "bg-gradient-to-r from-red-600 to-red-700 text-white"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>
                  </div>
                </div>

                {m.options && (
                  <div className="flex flex-wrap gap-2 mt-3 ml-1">
                    {m.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleOptionClick(opt)}
                        className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-full text-sm hover:bg-red-50 hover:border-red-300 hover:shadow-sm transition-all duration-200"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {hasSelectedLanguage && (
            <div className="border-t border-red-100 p-4 bg-white">
              <div className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUserInput()}
                  placeholder={PLACEHOLDERS[language] || PLACEHOLDERS.en}
                  className="w-full border border-red-300 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                  disabled={isTranslating}
                />
                <button
                  onClick={handleUserInput}
                  disabled={!input.trim() || isTranslating}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center ${
                    input.trim() && !isTranslating
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-200 text-gray-400"
                  } transition-colors`}
                >
                  ↗
                </button>
              </div>
              {isTranslating && (
                <div className="text-xs text-gray-500 text-center mt-2 flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Translating...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBot;