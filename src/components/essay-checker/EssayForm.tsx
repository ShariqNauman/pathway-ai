
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, FileText } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const essaySchema = z.object({
  essayType: z.string({
    required_error: "Please select an essay type",
  }),
  prompt: z.string().min(1, "Please enter the essay prompt"),
  essay: z.string().min(10, "Essay must be at least 10 characters"),
});

export type EssayFormValues = z.infer<typeof essaySchema>;

interface EssayFormProps {
  onSubmit: (data: EssayFormValues) => void;
  isAnalyzing: boolean;
  defaultValues?: EssayFormValues;
}

const EssayForm = ({ onSubmit, isAnalyzing, defaultValues }: EssayFormProps) => {
  const form = useForm<EssayFormValues>({
    resolver: zodResolver(essaySchema),
    defaultValues: defaultValues || {
      essayType: "",
      prompt: "",
      essay: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="essayType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Essay Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select essay type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Personal Statement/Essay">Personal Statement/Essay</SelectItem>
                  <SelectItem value="Common App Essay">Common App Essay</SelectItem>
                  <SelectItem value="Supplemental Essay">Supplemental Essay</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Essay Prompt/Topic</FormLabel>
              <FormControl>
                <Input placeholder="Enter the essay prompt or topic" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="essay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Essay</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Paste your essay here..." 
                  className="min-h-[200px]" 
                  {...field} 
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Essay...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Analyze Essay
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default EssayForm;
