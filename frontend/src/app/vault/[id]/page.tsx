import VaultDashboard from '@/components/VaultDashboard';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function VaultPage({ params }: Props) {
  const { id } = await params;
  return <VaultDashboard vaultId={id} />;
}
