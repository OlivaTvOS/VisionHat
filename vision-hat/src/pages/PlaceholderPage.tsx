interface PlaceholderPageProps { title: string; description: string }

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return <section className="grid min-h-[60vh] place-items-center"><div className="max-w-lg text-center"><div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-blue-600/15 text-blue-400"><span className="text-2xl">•••</span></div><h1 className="text-3xl font-bold text-white">{title}</h1><p className="mt-3 text-slate-400">{description}</p></div></section>
}
