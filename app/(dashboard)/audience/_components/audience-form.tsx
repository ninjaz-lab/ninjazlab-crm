"use client";

import {useState, useTransition} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {type AudienceRow, createAudience, updateAudience} from "@/lib/actions/audience";

interface Props {
  contact?: AudienceRow;
  onDone: () => void;
}

export function AudienceForm({ contact, onDone }: Props) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    firstName: contact?.firstName ?? "",
    lastName: contact?.lastName ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    address: contact?.address ?? "",
    city: contact?.city ?? "",
    state: contact?.state ?? "",
    country: contact?.country ?? "",
    postalCode: contact?.postalCode ?? "",
    notes: contact?.notes ?? "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const data = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== "")
      );
      if (contact) {
        await updateAudience(contact.id, data);
      } else {
        await createAudience(data);
      }
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>First Name</Label>
          <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Last Name</Label>
          <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Address</Label>
        <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>City</Label>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>State</Label>
          <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Country</Label>
          <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : contact ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
