import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Star, Edit2, Save, X } from "lucide-react";
import { CustomerRow } from "@/services/customerService";
import { useUpdateCustomer } from "@/hooks/useCustomers";

const memberProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  is_member: z.boolean(),
}).refine((data) => {
  // At least email or phone must be provided
  return data.email || data.phone;
}, {
  message: "Either email or phone must be provided",
  path: ["email"],
});

type MemberProfileFormValues = z.infer<typeof memberProfileSchema>;

interface MemberProfileDialogProps {
  member: CustomerRow | null;
  isOpen: boolean;
  onClose: () => void;
  onMemberUpdated?: () => void;
}

export function MemberProfileDialog({ member, isOpen, onClose, onMemberUpdated }: MemberProfileDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateCustomer = useUpdateCustomer();

  const form = useForm<MemberProfileFormValues>({
    resolver: zodResolver(memberProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
      is_member: true,
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        email: member.email || "",
        phone: member.phone || "",
        notes: member.notes || "",
        is_member: member.is_member ?? false,
      });
      setIsEditing(false);
    }
  }, [member, form]);

  const onSubmit = async (data: MemberProfileFormValues) => {
    if (!member) return;

    try {
      await updateCustomer.mutateAsync({
        id: member.id,
        data: {
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          notes: data.notes || null,
          is_member: data.is_member,
        },
      });
      
      setIsEditing(false);
      onMemberUpdated?.();
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            Member Profile
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Member name" 
                      {...field} 
                      disabled={!isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="member@example.com" 
                      {...field} 
                      disabled={!isEditing}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide either email or phone number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="+44 123 456 7890" 
                      {...field} 
                      disabled={!isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any special notes about this member..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                      disabled={!isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_member"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Member Status</FormLabel>
                    <FormDescription>
                      Toggle member status for this customer
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={!isEditing}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setIsEditing(false);
                    }}
                    disabled={updateCustomer.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateCustomer.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateCustomer.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


