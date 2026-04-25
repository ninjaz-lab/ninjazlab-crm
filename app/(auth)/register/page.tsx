"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {signUp} from "@/lib/auth-client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Database} from "lucide-react";
import {Routes} from "@/lib/constants/routes";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        const {error} = await signUp.email({name, email, password});
        if (error) {
            setError(error.message ?? "Registration failed");
            setLoading(false);
        } else {
            router.push(Routes.HOME);
        }
    }

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Left branding panel */}
            <div className="relative hidden flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-zinc-900"/>
                <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
                    <Database className="size-5"/>
                    NinjazCRM
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;Getting started took less than 5 minutes. The onboarding experience is the best
                            I&apos;ve seen.&rdquo;
                        </p>
                        <footer className="text-sm text-zinc-400">Marcus Lee · Operations Lead</footer>
                    </blockquote>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex items-center justify-center p-6 md:p-10">
                <div className="mx-auto w-full max-w-sm space-y-6">
                    <div className="flex flex-col gap-2 text-center">
                        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your details below to get started
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Creating account..." : "Create account"}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href={Routes.LOGIN} className="underline underline-offset-4 hover:text-primary">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
