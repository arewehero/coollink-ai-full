"use client";

/**
 * OnboardingFlow — 온보딩 3단계 폼 오케스트레이션 (명세서 §10.2~§10.5, §4.2)
 *
 * - 단일 useForm(ProfilePayload) + 단계별 trigger 검증
 * - localStorage draft 자동 저장/복원 (명세서 §6.1)
 * - 프로필 저장 API(PUT /profile)는 마지막 "완료" 버튼에서만 호출
 * - 저장 성공 시 위치 설정(/location)으로 이동 (명세서 §4.2)
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import type { DefaultValues, FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, isApiError } from "@/lib/api";
import {
  clearOnboardingDraft,
  loadOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/storage/onboardingDraft";
import {
  profileSchema,
  energyProfileSchema,
  homeEnvironmentSchema,
  lifestyleSchema,
  STEP_ERROR_MESSAGES,
  STEP_FIELD_GROUPS,
  type ProfileSchemaInput,
  type ProfileSchemaOutput,
} from "@/schemas/profile.schema";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { HomeEnvironmentStep } from "@/components/onboarding/HomeEnvironmentStep";
import { LifestyleStep } from "@/components/onboarding/LifestyleStep";
import { EnergyProfileStep } from "@/components/onboarding/EnergyProfileStep";
import { useAuth } from "@/hooks/useAuth";

const STEPS = [
  {
    title: "집 환경",
    description:
      "집 구조와 생활패턴을 알려주면 AI가 오늘의 절약 루틴을 시간대별로 짜드릴게요.",
  },
  {
    title: "생활패턴",
    description: "실제 집 체류 시간과 생활 유형을 판단해요.",
  },
  {
    title: "냉난방·전기요금",
    description: "절약액 계산 기준을 수집해요.",
  },
] as const;

const defaultValues: DefaultValues<ProfileSchemaInput> = {
  home_environment: {},
  lifestyle: {},
  energy_profile: {
    has_fan: false,
    current_temperature_setting: 26,
    daily_ac_usage_hours: 6,
    monthly_goal_bill: null,
    ac_power_watt: null,
    room_size: null,
    electricity_unit_price: null,
  },
};

export function OnboardingFlow() {
  const router = useRouter();
  const auth = useAuth();
  const form = useForm<ProfileSchemaInput, unknown, ProfileSchemaOutput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: "onTouched",
  });

  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const watchedValues = useWatch({ control: form.control });

  // draft 복원 + 변경 시 자동 저장
  // form.watch 대신 subscribe API 사용 (React Compiler 호환)
  useEffect(() => {
    const draft = loadOnboardingDraft<DefaultValues<ProfileSchemaInput>>();
    if (draft) form.reset(draft);
    const unsubscribe = form.subscribe({
      formState: { values: true },
      callback: ({ values }) => saveOnboardingDraft(values),
    });
    return () => unsubscribe();
  }, [form]);

  const isLast = step === STEPS.length - 1;
  const currentStepComplete = useMemo(() => {
    if (step === 0) {
      return homeEnvironmentSchema.safeParse(
        watchedValues.home_environment,
      ).success;
    }
    if (step === 1) {
      return lifestyleSchema.safeParse(watchedValues.lifestyle).success;
    }
    return energyProfileSchema.safeParse(watchedValues.energy_profile).success;
  }, [step, watchedValues]);

  const handleNext = async () => {
    setStepError(null);
    const valid = await form.trigger(
      STEP_FIELD_GROUPS[step] as FieldPath<ProfileSchemaInput>,
    );
    if (!valid) {
      setStepError(STEP_ERROR_MESSAGES[step]);
      return;
    }
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handlePrev = () => {
    setStepError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleExitToSplash = () => {
    router.replace("/");
  };

  const handleSubmit = form.handleSubmit(
    async (data) => {
      setSubmitError(null);
      setSubmitting(true);
      try {
        await api.saveProfile(data);
        await auth.refetchMe();
        clearOnboardingDraft();
        // 명세서 §4.2: 저장 후 위치 설정으로 이동
        router.push("/location");
      } catch (error) {
        setSubmitError(
          isApiError(error)
            ? error.message
            : "저장에 실패했어요. 잠시 후 다시 시도해주세요.",
        );
        setSubmitting(false);
      }
    },
    () => {
      // 검증 실패 → 마지막 단계 안내
      setStepError(STEP_ERROR_MESSAGES[STEPS.length - 1]);
    },
  );

  return (
    <OnboardingLayout
      step={step}
      total={STEPS.length}
      title={STEPS[step].title}
      description={STEPS[step].description}
      stepError={stepError}
      submitError={submitError}
      submitting={submitting}
      canGoPrev={step > 0}
      isLast={isLast}
      nextLabel={isLast ? "오늘의 절약 루틴 만들기" : "다음"}
      nextDisabled={!currentStepComplete}
      onExitToSplash={handleExitToSplash}
      onPrev={handlePrev}
      onNext={isLast ? handleSubmit : handleNext}
    >
      {step === 0 ? <HomeEnvironmentStep control={form.control} /> : null}
      {step === 1 ? <LifestyleStep control={form.control} /> : null}
      {step === 2 ? <EnergyProfileStep control={form.control} /> : null}
    </OnboardingLayout>
  );
}
