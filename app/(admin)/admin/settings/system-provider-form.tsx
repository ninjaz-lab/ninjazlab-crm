"use client";

import {useState, useTransition} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Info} from "lucide-react";
import {
    createMarketingProvider,
    deleteMarketingProvider,
    setMarketingProvider,
} from "@/lib/actions/admin/marketing-provider";
import {ProviderListSection} from "./_components/provider-list-section";
import {ProviderTypeSelector} from "./_components/provider-type-selector";
import {ProviderSesSection} from "./_components/provider-ses-section";
import {ProviderFormFooter} from "./_components/provider-form-footer";

type Provider = {
    id: string;
    name: string;
    channel: string;
    config: unknown;
    isDefault: boolean;
    createdAt: Date;
};
type ProviderType = "ses";

export function SystemProviderForm({providers}: { providers: Provider[] }) {
    const [isPending, startTransition] = useTransition();
    const [adding, setAdding] = useState(false);
    const [success, setSuccess] = useState("");

    const [providerType, setProviderType] = useState<ProviderType>("ses");
    const [name, setName] = useState("");
    const [isDefault, setIsDefault] = useState(providers.length === 0);

    // SES Config
    const [sesRegion, setSesRegion] = useState("ap-southeast-1");
    const [sesAccessKeyId, setSesAccessKeyId] = useState("");
    const [sesSecretAccessKey, setSesSecretAccessKey] = useState("");

    function isValid() {
        return !!(name && sesAccessKeyId && sesSecretAccessKey);
    }

    function buildConfig(): Record<string, string> {
        return {
            type: "ses",
            region: sesRegion,
            accessKeyId: sesAccessKeyId,
            secretAccessKey: sesSecretAccessKey
        };
    }

    function handleSave() {
        startTransition(async () => {
            await createMarketingProvider({
                channel: "email",
                name,
                type: providerType,
                config: buildConfig(),
                isDefault,
            });
            setAdding(false);
            setSuccess("Provider saved. All email campaigns will now use this provider.");
            setTimeout(() => setSuccess(""), 4000);

            // reset
            setName("");
            setSesAccessKeyId("");
            setSesSecretAccessKey("");
        });
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            await deleteMarketingProvider(id);
        });
    }

    function handleSetDefault(id: string) {
        startTransition(async () => {
            await setMarketingProvider(id, "email");
            setSuccess("Default provider updated.");
            setTimeout(() => setSuccess(""), 3000);
        });
    }

    const providerConfig = (p: Provider) => p.config as Record<string, string>;

    return (
        <div className="space-y-6">
            <Alert>
                <Info className="size-4"/>
                <AlertDescription className="text-sm">
                    These providers are <strong>system-wide</strong>. Users cannot see or change them.
                    The <strong>default</strong> provider is used for all outgoing campaigns.
                </AlertDescription>
            </Alert>

            <ProviderListSection
                providers={providers}
                isPending={isPending}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
                onAddClick={() => setAdding(true)}
                success={success}
            />

            {adding && (
                <Card>
                    <CardHeader>
                        <CardTitle>New Provider</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <ProviderTypeSelector
                            providerType={providerType}
                            onProviderTypeChange={setProviderType}
                            name={name}
                            onNameChange={setName}
                        />

                        <ProviderSesSection
                            sesRegion={sesRegion}
                            onSesRegionChange={setSesRegion}
                            sesAccessKeyId={sesAccessKeyId}
                            onSesAccessKeyIdChange={setSesAccessKeyId}
                            sesSecretAccessKey={sesSecretAccessKey}
                            onSesSecretAccessKeyChange={setSesSecretAccessKey}
                        />

                        <ProviderFormFooter
                            isDefault={isDefault}
                            onIsDefaultChange={setIsDefault}
                            isPending={isPending}
                            isValid={isValid()}
                            onCancel={() => setAdding(false)}
                            onSave={handleSave}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}