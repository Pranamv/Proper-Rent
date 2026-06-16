import { Check } from "@phosphor-icons/react/dist/ssr";

type AdminSaveNoticeProps = {
  message: string;
};

export function AdminSaveNotice({ message }: AdminSaveNoticeProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
      role="status"
    >
      <Check aria-hidden="true" className="mt-0.5 shrink-0" size={18} weight="bold" />
      <p className="font-semibold">{message}</p>
    </div>
  );
}
