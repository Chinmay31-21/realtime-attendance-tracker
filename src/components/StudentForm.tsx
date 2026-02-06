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
import { CheckCircle2, Loader2, Shield, User, Hash, BookOpen, Users, Calendar, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  studentName: z.string().min(2, "Name must be at least 2 characters").max(100),
  uid: z.string().min(1, "UID is required").max(20),
  branch: z.string().min(1, "Branch is required"),
  division: z.string().min(1, "Division is required"),
  batch: z.string().min(1, "Batch is required"),
  room: z.string().min(1, "Room is required"),
});

type FormData = z.infer<typeof formSchema>;

interface StudentFormProps {
  sessionId: string;
  deviceFingerprint: string;
  onSubmit: (data: FormData) => void;
}

const branches = [
  "Computer Science & Engineering",
  "Computer Engineering",
  "Information Technology",
  "Electronics & Telecommunication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Instrumentation Engineering",
];

const divisions = ["A", "B", "C", "D"];
const batches = ["B1", "B2", "B3", "B4"];
const rooms = ["008", "002", "103", "105"] as const;

export function StudentForm({ sessionId, deviceFingerprint, onSubmit }: StudentFormProps) {
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
    
    try {
      const { error } = await supabase.from('attendance_records').insert({
        session_id: sessionId,
        student_name: data.studentName.trim(),
        uid: data.uid.trim().toUpperCase(),
        branch: data.branch,
        division: data.division,
        batch: data.batch,
        room: data.room as typeof rooms[number],
        device_fingerprint: deviceFingerprint,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already recorded attendance for this session');
        } else {
          throw error;
        }
        setIsSubmitting(false);
        return;
      }
      
      setIsSubmitted(true);
      onSubmit(data);
      toast.success("Attendance recorded successfully!");
    } catch (error: any) {
      toast.error(error.message || 'Failed to record attendance');
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Attendance Recorded!</h3>
        <p className="text-muted-foreground mb-4">
          Your attendance has been successfully marked.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium">
          <Shield className="w-4 h-4" />
          Verified & Secured
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
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

      {/* UID */}
      <div className="space-y-2">
        <Label htmlFor="uid" className="flex items-center gap-2 text-foreground">
          <Hash className="w-4 h-4" />
          UID (University ID)
        </Label>
        <Input
          id="uid"
          placeholder="Enter your UID"
          className="input-secure font-mono uppercase"
          {...register("uid")}
        />
        {errors.uid && (
          <p className="text-sm text-destructive">{errors.uid.message}</p>
        )}
      </div>

      {/* Branch */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-foreground">
          <BookOpen className="w-4 h-4" />
          Branch
        </Label>
        <Select onValueChange={(value) => setValue("branch", value)}>
          <SelectTrigger className="input-secure">
            <SelectValue placeholder="Select your branch" />
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

      {/* Division & Batch Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <Users className="w-4 h-4" />
            Division
          </Label>
          <Select onValueChange={(value) => setValue("division", value)}>
            <SelectTrigger className="input-secure">
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map((div) => (
                <SelectItem key={div} value={div}>
                  Division {div}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.division && (
            <p className="text-sm text-destructive">{errors.division.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <Calendar className="w-4 h-4" />
            Batch
          </Label>
          <Select onValueChange={(value) => setValue("batch", value)}>
            <SelectTrigger className="input-secure">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((batch) => (
                <SelectItem key={batch} value={batch}>
                  {batch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.batch && (
            <p className="text-sm text-destructive">{errors.batch.message}</p>
          )}
        </div>
      </div>

      {/* Room */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-foreground">
          <Building2 className="w-4 h-4" />
          Room Number
        </Label>
        <Select onValueChange={(value) => setValue("room", value)}>
          <SelectTrigger className="input-secure">
            <SelectValue placeholder="Select your room" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((room) => (
              <SelectItem key={room} value={room}>
                Room {room}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.room && (
          <p className="text-sm text-destructive">{errors.room.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-lg font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Recording...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5 mr-2" />
            Record Attendance
          </>
        )}
      </Button>
    </form>
  );
}
