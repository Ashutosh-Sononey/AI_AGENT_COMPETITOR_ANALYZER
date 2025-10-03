"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { addCompetitor } from "@/lib/api"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  website_url: z.string().url({ message: "Please enter a valid URL." }),
  rss_feed_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  category: z.string().min(2, { message: "Category is required." }),
  priority: z.enum(["High", "Medium", "Low"]),
  tags: z.string().optional(),
})

interface AddCompetitorDialogProps {
  onCompetitorAdded: () => void;
}

export function AddCompetitorDialog({ onCompetitorAdded }: AddCompetitorDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      website_url: "",
      rss_feed_url: "",
      category: "",
      priority: "Medium",
      tags: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await addCompetitor(
        values.name,
        values.website_url,
        values.category,
        values.priority,
        values.tags || '',
        values.rss_feed_url || undefined,
      );
      toast({
        title: "Success!",
        description: `Competitor "${values.name}" has been added.`,
      })
      form.reset();
      onCompetitorAdded(); // Refresh the list in the parent component
      setIsOpen(false); // Close the dialog
    } catch (error) {
      console.error("Failed to add competitor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add competitor. Please check the console for details.",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add Competitor</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Competitor</DialogTitle>
          <DialogDescription>
            Enter the details of the competitor you want to track.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competitor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://acme.com/blog" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rss_feed_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RSS Feed URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://acme.com/rss.xml" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SaaS, E-commerce" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ai, enterprise, design" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Add Competitor</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}