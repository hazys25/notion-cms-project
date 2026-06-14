"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginFormValues } from "@/schemas/login-schema";
import type { ApiResponse } from "@/types/api";

export default function LoginPage() {
  // 로그인 성공 후 페이지 이동에 사용
  const router = useRouter();

  // 로그인 폼 (RHF + Zod 검증)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // 폼 제출 핸들러
  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = (await response.json()) as ApiResponse<{ username: string }>;

      if (result.success) {
        toast.success("로그인되었습니다.");
        // 보호된 홈으로 이동 + 서버 컴포넌트 상태 갱신
        router.replace("/");
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <main className="relative flex flex-1 items-center justify-center px-6 py-12">
      {/* 로그인 전에도 테마를 바꿀 수 있도록 우측 상단에 토글 배치 */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>관리자 로그인</CardTitle>
          <CardDescription>관리자 계정으로 로그인하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>아이디</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" autoComplete="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={form.formState.isSubmitting}>
                <LogIn />
                {form.formState.isSubmitting ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
