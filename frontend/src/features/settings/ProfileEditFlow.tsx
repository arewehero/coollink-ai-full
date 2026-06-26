"use client";

/**
 * ProfileEditFlow — /settings/profile 프로필 수정 (명세서 §4.4, §10.15)
 *
 * GET /profile로 채운 폼에서 섹션(home/lifestyle/energy)을 수정하고
 * PATCH /profile/{section}으로 저장한다. 생활패턴·요금 수정 시 재분석/재계산
 * 배너를 띄우고 "오늘 플랜 다시 생성"(force_regenerate)을 제공한다.
 */
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import type { DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, isApiError } from "@/lib/api";
import type { GenerateDailyPlanBody } from "@/types/api";
import {
  profileSchema,
  type ProfileSchemaInput,
  type ProfileSchemaOutput,
} from "@/schemas/profile.schema";
import { HomeEnvironmentStep } from "@/components/onboarding/HomeEnvironmentStep";
import { LifestyleStep } from "@/components/onboarding/LifestyleStep";
import { EnergyProfileStep } from "@/components/onboarding/EnergyProfileStep";
import { PageHeader } from "@/components/common/PageHeader";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { ErrorView } from "@/components/common/ErrorView";
import { FormHelperText } from "@/components/form/FormHelperText";
import { useToast } from "@/components/common/ToastProvider";
import { getStoredLocation } from "@/lib/storage/location";
import { getTodayKst } from "@/lib/format/date";

type Section = "home" | "lifestyle" | "energy";

const SECTION_META: Record<
  Section,
  { title: string; field: "home_environment" | "lifestyle" | "energy_profile"; needsRegen: boolean }
> = {
  home: { title: "내 집 정보 수정", field: "home_environment", needsRegen: false },
  lifestyle: { title: "생활패턴 수정", field: "lifestyle", needsRegen: true },
  energy: { title: "냉난방·전기요금 수정", field: "energy_profile", needsRegen: true },
};

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

function parseSection(value: string | null): Section {
  return value === "lifestyle" || value === "energy" ? value : "home";
}

export function ProfileEditFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = parseSection(searchParams.get("section"));
  const meta = SECTION_META[section];
  const { showToast } = useToast();

  const form = useForm<ProfileSchemaInput, unknown, ProfileSchemaOutput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: "onTouched",
  });

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [regenNeeded, setRegenNeeded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    api
      .getProfile(controller.signal)
      .then((profile) => {
        if (!active) return;
        form.reset(profile);
        setStatus("ready");
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) return;
        if (isApiError(error) && error.code === "PROFILE_NOT_FOUND") {
          router.replace("/onboarding");
          return;
        }
        setStatus("error");
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [form, router, attempt]);

  const handleSave = async () => {
    const valid = await form.trigger(meta.field);
    if (!valid) return;
    setSaving(true);
    try {
      const values = form.getValues();
      if (section === "home") {
        await api.updateHomeEnvironment(values.home_environment);
      } else if (section === "lifestyle") {
        await api.updateLifestyle(values.lifestyle);
      } else {
        await api.updateEnergy(values.energy_profile);
      }
      showToast("저장했어요.", "success");
      if (meta.needsRegen) setRegenNeeded(true);
    } catch (error) {
      showToast(
        isApiError(error)
          ? error.message
          : "저장에 실패했어요. 잠시 후 다시 시도해주세요.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const location = getStoredLocation();
      const body: GenerateDailyPlanBody = {
        date: getTodayKst(),
        force_regenerate: true,
      };
      if (location?.type === "gps") {
        body.latitude = location.latitude;
        body.longitude = location.longitude;
      } else if (location?.type === "region") {
        body.region_name = location.region_name;
      }
      await api.generateDailyPlan(body);
      router.push("/today");
    } catch (error) {
      showToast(
        isApiError(error) ? error.message : "플랜 생성에 실패했어요.",
        "error",
      );
      setRegenerating(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title={meta.title} subtitle="입력값을 수정하고 저장하세요" />
      <div className="flex-1 px-5 py-6">
        {status === "loading" ? (
          <div className="flex flex-col gap-4">
            <SkeletonCard rows={4} />
            <SkeletonCard rows={3} />
          </div>
        ) : status === "error" ? (
          <ErrorView
            title="프로필을 불러오지 못했어요."
            message="잠시 후 다시 시도해주세요."
            actionLabel="다시 시도"
            onAction={() => {
              setStatus("loading");
              setAttempt((n) => n + 1);
            }}
          />
        ) : (
          <>
            {section === "home" ? (
              <HomeEnvironmentStep control={form.control} />
            ) : section === "lifestyle" ? (
              <LifestyleStep control={form.control} />
            ) : (
              <EnergyProfileStep control={form.control} />
            )}

            {regenNeeded ? (
              <div className="mt-6 flex flex-col gap-2 rounded-xl bg-primary-soft px-4 py-3">
                <FormHelperText>
                  생활패턴·요금이 바뀌었어요. 오늘 플랜을 다시 생성하면 더
                  정확한 추천을 받을 수 있어요.
                </FormHelperText>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {regenerating ? "생성 중…" : "오늘 플랜 다시 생성"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {status === "ready" ? (
        <div className="sticky bottom-0 border-t border-border bg-surface px-5 py-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "저장 중…" : "저장하기"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
