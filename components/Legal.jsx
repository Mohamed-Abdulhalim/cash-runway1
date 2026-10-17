import Layout from './Layout'
import AuthButtons from './AuthButtons'

export default function Legal({ title, updated, sections }) {
  return (
    <Layout title={title} right={<AuthButtons />}>
      <article className="max-w-2xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-[#6B6B6B] mt-1 mb-10">Last updated: {updated}</p>
        <div className="space-y-8 text-[#3D3D3D]">
          {sections.map(([heading, body], i) => (
            <section key={heading}>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">{i + 1}. {heading}</h2>
              {[].concat(body).map((p, j) =>
                Array.isArray(p) ? (
                  <ul key={j} className="text-sm space-y-1.5 list-disc pl-5 text-[#4B4B4B]">{p.map(li => <li key={li}>{li}</li>)}</ul>
                ) : (
                  <p key={j} className="text-sm leading-relaxed mb-2">{p}</p>
                )
              )}
            </section>
          ))}
        </div>
      </article>
    </Layout>
  )
}
