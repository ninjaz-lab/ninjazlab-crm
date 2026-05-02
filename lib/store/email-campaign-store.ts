import {create} from "zustand";
import {CAMPAIGN_STATUS} from "@/lib/enums";

export type SendMode = "draft" | "now" | "schedule";
export type RecipientRow = { email: string; firstName?: string; lastName?: string };

interface CampaignState {
    name: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    templateId: string;
    recipientRows: RecipientRow[];
    sendMode: SendMode;
    scheduledAt: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;

    // Actions
    setName: (val: string) => void;
    setFromName: (val: string) => void;
    setFromEmail: (val: string) => void;
    setReplyTo: (val: string) => void;
    setTemplateId: (val: string) => void;
    setRecipientRows: (val: RecipientRow[]) => void;
    setSendMode: (val: SendMode) => void;
    setScheduledAt: (val: string) => void;
    setUtmSource: (val: string) => void;
    setUtmMedium: (val: string) => void;
    setUtmCampaign: (val: string) => void;
    reset: () => void;
}

export const useEmailCampaignStore = create<CampaignState>((set) => ({
    // Initial State
    name: "",
    fromName: "",
    fromEmail: "",
    replyTo: "",
    templateId: "",
    recipientRows: [],
    sendMode: CAMPAIGN_STATUS.DRAFT,
    scheduledAt: "",
    utmSource: "email",
    utmMedium: "newsletter",
    utmCampaign: "",

    // Setters
    setName: (name) => set({name}),
    setFromName: (fromName) => set({fromName}),
    setFromEmail: (fromEmail) => set({fromEmail}),
    setReplyTo: (replyTo) => set({replyTo}),
    setTemplateId: (templateId) => set({templateId}),
    setRecipientRows: (recipientRows) => set({recipientRows}),
    setSendMode: (sendMode) => set({sendMode}),
    setScheduledAt: (scheduledAt) => set({scheduledAt}),
    setUtmSource: (utmSource) => set({utmSource}),
    setUtmMedium: (utmMedium) => set({utmMedium}),
    setUtmCampaign: (utmCampaign) => set({utmCampaign}),

    // Reset function to clear the form after successful submission
    reset: () => set({
        name: "",
        fromName: "",
        fromEmail: "",
        replyTo: "",
        templateId: "",
        recipientRows: [],
        sendMode: CAMPAIGN_STATUS.DRAFT,
        scheduledAt: "",
        utmSource: "email",
        utmMedium: "newsletter",
        utmCampaign: ""
    })
}));
