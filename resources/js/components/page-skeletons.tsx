import { FestivePageLoader, FestivePanelLoader } from '@/components/festive-page-loader';
import type { PageSkeletonKind } from '@/lib/page-skeleton';

/** Destination-aware festive cartoon loader — replaces layout bone skeletons. */
export function PageSkeleton({
    kind,
    path,
    className,
}: {
    kind: PageSkeletonKind;
    path?: string | null;
    className?: string;
}) {
    return <FestivePageLoader kind={kind} path={path} className={className} />;
}

export function SettingsPanelSkeleton({ className }: { className?: string }) {
    return <FestivePanelLoader kind="settings" className={className} />;
}

export function AuthPanelSkeleton({ className }: { className?: string }) {
    return <FestivePanelLoader kind="auth" className={className} />;
}

/** @deprecated Prefer PageSkeleton — kept for any stray imports. */
export const WelcomeSkeleton = (props: { className?: string }) => <PageSkeleton kind="welcome" {...props} />;
export const DesignsSkeleton = (props: { className?: string }) => <PageSkeleton kind="designs" {...props} />;
export const GallerySkeleton = (props: { className?: string }) => <PageSkeleton kind="gallery" {...props} />;
export const FormatsSkeleton = (props: { className?: string }) => <PageSkeleton kind="formats" {...props} />;
export const SeoSkeleton = (props: { className?: string }) => <PageSkeleton kind="seo" {...props} />;
export const DashboardSkeleton = (props: { className?: string }) => <PageSkeleton kind="dashboard" {...props} />;
export const EventsIndexSkeleton = (props: { className?: string }) => <PageSkeleton kind="events-index" {...props} />;
export const EventsCreateSkeleton = (props: { className?: string }) => <PageSkeleton kind="events-create" {...props} />;
export const EventsShowSkeleton = (props: { className?: string }) => <PageSkeleton kind="events-show" {...props} />;
export const GuestsSkeleton = (props: { className?: string }) => <PageSkeleton kind="guests" {...props} />;
export const AnalyticsSkeleton = (props: { className?: string }) => <PageSkeleton kind="analytics" {...props} />;
export const SettingsSkeleton = (props: { className?: string }) => <PageSkeleton kind="settings" {...props} />;
export const AuthSkeleton = (props: { className?: string }) => <PageSkeleton kind="auth" {...props} />;
export const SiteEditorSkeleton = (props: { className?: string }) => <PageSkeleton kind="site-editor" {...props} />;
export const CardEditorSkeleton = (props: { className?: string }) => <PageSkeleton kind="card-editor" {...props} />;
export const PreviewSkeleton = (props: { className?: string }) => <PageSkeleton kind="preview" {...props} />;
export const PublicSiteSkeleton = (props: { className?: string }) => <PageSkeleton kind="public-site" {...props} />;
export const PublicCardSkeleton = (props: { className?: string }) => <PageSkeleton kind="public-card" {...props} />;
export const ErrorSkeleton = (props: { className?: string }) => <PageSkeleton kind="error" {...props} />;
export const GenericSkeleton = (props: { className?: string }) => <PageSkeleton kind="generic" {...props} />;
