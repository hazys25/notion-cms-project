"use client"

import * as React from "react"
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * react-hook-form 을 shadcn 스타일로 감싼 폼 프리미티브 모음.
 *
 * shadcn 공식 form 컴포넌트는 @radix-ui/react-slot 에 의존하지만,
 * 이 프로젝트(base-nova 프리셋)에는 해당 패키지가 없으므로
 * 외부 의존성 없이 최소 Slot 을 직접 구현해 동일한 사용 경험을 제공한다.
 *
 * 사용 흐름:
 *   <Form {...form}>
 *     <FormField name="email" control={form.control} render={({ field }) => (
 *       <FormItem>
 *         <FormLabel>이메일</FormLabel>
 *         <FormControl><Input {...field} /></FormControl>
 *         <FormMessage />   // 검증 에러 메시지 자동 표시
 *       </FormItem>
 *     )} />
 *   </Form>
 */

// ──────────────────────────────────────────────────────────────
// Slot: 자식 엘리먼트에 부모가 지정한 props(id, aria-* 등)를 합쳐 그대로 렌더링한다.
//       <FormControl><Input/></FormControl> 처럼 단일 자식을 감쌀 때 사용.
// ──────────────────────────────────────────────────────────────
type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode
}

function Slot({ children, ...slotProps }: SlotProps) {
  // 유효한 단일 엘리먼트가 아니면 아무것도 렌더링하지 않는다.
  if (!React.isValidElement(children)) {
    return null
  }

  const child = children as React.ReactElement<Record<string, unknown>>

  // 부모 props 를 먼저 깔고, 자식이 직접 지정한 props 가 우선되도록 덮어쓴다.
  return React.cloneElement(child, {
    ...slotProps,
    ...child.props,
  })
}

// ──────────────────────────────────────────────────────────────
// Form: react-hook-form 의 FormProvider 를 그대로 노출하는 별칭
// ──────────────────────────────────────────────────────────────
const Form = FormProvider

// 현재 필드의 name 을 하위 컴포넌트에 전달하기 위한 컨텍스트
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
)

// FormField: react-hook-form 의 Controller 를 감싸고, name 을 컨텍스트로 내려준다.
function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

// 각 FormItem 의 고유 id 를 하위 컴포넌트에 전달하기 위한 컨텍스트
type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
)

/**
 * 현재 필드의 id 와 상태(에러 등)를 모아주는 커스텀 훅.
 * FormLabel / FormControl / FormMessage 가 공통으로 사용한다.
 */
function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField 는 <FormField> 내부에서만 사용할 수 있습니다.")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    // 접근성(aria) 연결에 사용할 id 들
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

// FormItem: 라벨/입력/메시지를 하나로 묶는 컨테이너. 고유 id 를 생성한다.
function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("grid gap-2", className)} {...props} />
    </FormItemContext.Provider>
  )
}

// FormLabel: 현재 필드와 연결된 라벨. 에러가 있으면 색상이 바뀐다.
function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

// FormControl: 실제 입력 요소(Input/Textarea 등)에 id 와 aria 속성을 주입한다.
function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? formDescriptionId
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

// FormDescription: 입력에 대한 보조 설명 텍스트
function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

// FormMessage: 검증 에러 메시지를 자동으로 표시한다. 에러가 없으면 렌더링하지 않는다.
function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
  // 에러가 있으면 에러 메시지를, 없으면 children 을 표시
  const body = error ? String(error?.message ?? "") : props.children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useFormField,
}
