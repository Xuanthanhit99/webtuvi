import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo';
import { articlesByCluster, CLUSTERS, type KnowledgeCluster } from '@/features/knowledge/content';

type Props={params:Promise<{cluster:string}>};
export function generateStaticParams(){return Object.keys(CLUSTERS).map(cluster=>({cluster}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {cluster}=await params; const c=CLUSTERS[cluster as KnowledgeCluster]; if(!c)return {}; return buildMetadata({title:c.title,description:c.description,path:`/kien-thuc/${cluster}`});}
export default async function ClusterPage({params}:Props){const {cluster}=await params; const c=CLUSTERS[cluster as KnowledgeCluster]; if(!c)notFound(); const articles=articlesByCluster(cluster as KnowledgeCluster); return <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-16"><nav className="text-sm text-muted-foreground"><Link href="/kien-thuc">Kiến thức</Link> / {c.title}</nav><h1 className="mt-5 text-4xl font-semibold">{c.title}</h1><p className="mt-4 text-lg leading-8 text-muted-foreground">{c.description}</p><div className="mt-9 space-y-4">{articles.map(a=><Link key={a.slug} href={`/kien-thuc/${cluster}/${a.slug}`} className="block rounded-2xl border border-border p-6"><h2 className="text-xl font-semibold">{a.title}</h2><p className="mt-2 leading-7 text-muted-foreground">{a.description}</p></Link>)}</div><Link href={c.toolHref} className="mt-10 inline-flex rounded-xl bg-foreground px-5 py-3 font-semibold text-background">Mở công cụ {c.title.replace('Kiến thức ','')}</Link></div>}
