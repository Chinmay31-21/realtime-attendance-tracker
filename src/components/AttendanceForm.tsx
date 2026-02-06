import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, Shield, User, Hash, BookOpen, Building2 } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  studentName: z.string().min(2, "Name must be at least 2 characters").max(100),
  rollNumber: z.string().min(1, "Roll number is required").max(20),
  branch: z.string().min(1, "Branch is required"),
  year: z.string().min(1, "Year is required"),
  section: z.string().min(1, "Section is required"),
  roomNumber: z.string().min(1, "Room number is required"),
});

type FormData = z.infer<typeof formSchema>;

interface AttendanceFormProps {
  sessionCode: string;
  onSubmit: (data: FormData) => void;
}

const branches = [
  "Computer Science & Engineering",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology",
  "Chemical Engineering",
];

const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const sections = ["A", "B", "C", "D", "E"];
const rooms = ["Room 101", "Room 102", "Room 103", "Room 201", "Room 202", "Room 203", "Seminar Hall 1", "Seminar Hall 2", "Auditorium"];

export function AttendanceForm({ sessionCode, onSubmit }: AttendanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    onSubmit(data);
    toast.success("Attendance marked successfully!");
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Attendance Recorded!</h3>
        <p className="text-muted-foreground mb-4">
          Your attendance has been successfully marked for this session.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium">
          <Shield className="w-4 h-4" />
          Session: {sessionCode}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Student Name */}
        <div className="space-y-2">
          <Label htmlFor="studentName" className="flex items-center gap-2 text-foreground">
            <User className="w-4 h-4" />
            Full Name
          </Label>
          <Input
            id="studentName"
            placeholder="Enter your full name"
            className="input-secure"
            {...register("studentName")}
          />
          {errors.studentName && (
            <p className="text-sm text-destructive">{errors.studentName.message}</p>
          )}
        </div>

        {/* Roll Number */}
        <div className="space-y-2">
          <Label htmlFor="rollNumber" className="flex items-center gap-2 text-foreground">
            <Hash className="w-4 h-4" />
            Roll Number
          </Label>
          <Input
            id="rollNumber"
            placeholder="Enter your roll number"
            className="input-secure font-mono"
            {...register("rollNumber")}
          />
          {errors.rollNumber && (
            <p className="text-sm text-destructive">{errors.rollNumber.message}</p>
          )}
        </div>

        {/* Branch & Year Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-foreground">
              <BookOpen className="w-4 h-4" />
              Branch
            </Label>
            <Select onValueChange={(value) => setValue("branch", value)}>
              <SelectTrigger className="input-secure">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.branch && (
              <p className="text-sm text-destructive">{errors.branch.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Year</Label>
            <Select onValueChange={(value) => setValue("year", value)}>
              <SelectTrigger className="input-secure">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.year && (
              <p className="text-sm text-destructive">{errors.year.message}</p>
            )}
          </div>
        </div>

        {/* Section & Room Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Section</Label>
            <Select onValueChange={(value) => setValue("section", value)}>
              <SelectTrigger className="input-secure">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section} value={section}>
                    Section {section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.section && (
              <p className="text-sm text-destructive">{errors.section.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-foreground">
              <Building2 className="w-4 h-4" />
              Room
            </Label>
            <Select onValueChange={(value) => setValue("roomNumber", value)}>
              <SelectTrigger className="input-secure">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room} value={room}>
                    {room}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roomNumber && (
              <p className="text-sm text-destructive">{errors.roomNumber.message}</p>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-lg font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5 mr-2" />
            Mark Attendance
          </>
        )}
      </Button>
    </form>
  );
}
