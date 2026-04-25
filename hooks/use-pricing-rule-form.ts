import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {createPricingRule, deletePricingRule, updatePricingRule} from "@/lib/actions/admin/pricing";
import {TRANSACTION_CAMPAIGN, USER_ROLES, UserRole} from "@/lib/enums";
import {toast} from "sonner";

export interface PricingRule {
    id: string;
    userId: string | null;
    userName: string | null;
    campaign: string;
    unitPrice: string;
    effectiveFrom: Date;
    note?: string | null;
}

export function usePricingRuleForm(rules: PricingRule[]) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);

    // Form state
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [scope, setScope] = useState<"default" | UserRole>("default");
    const [selectedUserId, setSelectedUserId] = useState("");
    const [campaign, setCampaign] = useState<string>(TRANSACTION_CAMPAIGN.EMAIL);
    const [unitPrice, setUnitPrice] = useState("0.10");
    const [effectiveFrom, setEffectiveFrom] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });
    const [note, setNote] = useState("");
    const [error, setError] = useState("");
    const [ruleToDelete, setRuleToDelete] = useState<PricingRule | null>(null);

    function resetForm() {
        setEditingRuleId(null);
        setScope("default");
        setSelectedUserId("");
        setCampaign(TRANSACTION_CAMPAIGN.EMAIL);
        setUnitPrice("0.10");
        setEffectiveFrom(new Date().toISOString());
        setNote("");
        setError("");
    }

    function handleEdit(rule: PricingRule) {
        setEditingRuleId(rule.id);
        setScope(rule.userId ? USER_ROLES.USER : "default");
        setSelectedUserId(rule.userId || "");
        setCampaign(rule.campaign);

        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setEffectiveFrom(now.toISOString().slice(0, 16));

        setEffectiveFrom(new Date(rule.effectiveFrom).toISOString());

        setNote(rule.note || "");
        setDialogOpen(true);
    }

    function handleSave() {
        const priceNum = Number(unitPrice);
        if (isNaN(priceNum) || priceNum < 0) {
            setError("Unit price must be a valid non-negative number.");
            return;
        }
        if (scope === USER_ROLES.USER && !selectedUserId) {
            setError("Please select a user.");
            return;
        }

        const newEffectiveDate = new Date(effectiveFrom);
        newEffectiveDate.setSeconds(0, 0);

        const isDuplicate = rules.some(r => {
            if (editingRuleId && r.id === editingRuleId) return false;
            const isSameUser = scope === USER_ROLES.USER ? r.userId === selectedUserId : r.userId === null;
            const isSameCampaign = r.campaign === campaign;
            const existingDate = new Date(r.effectiveFrom);
            existingDate.setSeconds(0, 0);
            return isSameUser && isSameCampaign && newEffectiveDate.getTime() === existingDate.getTime();
        });

        if (isDuplicate) {
            setError("A rule for this campaign and exact effective date already exists for this scope.");
            return;
        }

        setError("");
        startTransition(async () => {
            try {
                if (editingRuleId) {
                    await updatePricingRule(editingRuleId, {
                        unitPrice: priceNum.toFixed(6),
                        effectiveFrom: new Date(effectiveFrom),
                        note: note || undefined,
                    });
                    toast.success("Pricing rule updated successfully!");
                } else {
                    await createPricingRule({
                        userId: scope === USER_ROLES.USER ? selectedUserId : null,
                        campaign,
                        unitPrice: priceNum.toFixed(6),
                        effectiveFrom: new Date(effectiveFrom),
                        note: note || undefined,
                    });
                    toast.success("Pricing rule created successfully!");
                }
                setDialogOpen(false);
                resetForm();
                router.refresh();
            } catch (err) {
                toast.error("An error occurred while saving the pricing rule.");
            }
        });
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            try {
                await deletePricingRule(id);
                toast.success("Pricing rule deleted.");
                router.refresh();
            } catch (err) {
                toast.error("Failed to delete pricing rule.");
            }
        });
    }

    return {
        // State
        isPending,
        dialogOpen,
        setDialogOpen,
        editingRuleId,
        scope,
        setScope,
        selectedUserId,
        setSelectedUserId,
        campaign,
        setCampaign,
        unitPrice,
        setUnitPrice,
        effectiveFrom,
        setEffectiveFrom,
        note,
        setNote,
        error,
        ruleToDelete,
        setRuleToDelete,
        // Methods
        resetForm,
        handleEdit,
        handleSave,
        handleDelete,
    };
}
