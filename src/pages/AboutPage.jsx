import { Page } from '@/components/layout/Page.jsx';
import { Card, CardBody } from '@/components/ui/Card.jsx';
import { useSitePages } from '@/features/site-pages/hooks.js';
import { SITE_PAGES_DEFAULTS, resolvePageIcon } from '@/features/site-pages/defaults.js';
import {
  CompanyHero,
  Prose,
  Section,
  SectionLabel,
  PageDisabled,
} from '@/features/site-pages/components.jsx';

export default function AboutPage() {
  const { data } = useSitePages();
  const page = { ...SITE_PAGES_DEFAULTS.about, ...data?.about };

  if (page.enabled === false) {
    return (
      <Page>
        <PageDisabled title="About Us" />
      </Page>
    );
  }

  return (
    <Page>
      <CompanyHero hero={page.hero} current="About Us" />

      {/* Stats */}
      {page.stats?.length > 0 && (
        <Section className="mt-12">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {page.stats.map((s, i) => (
              <Card key={i} className="text-center">
                <CardBody>
                  <p className="text-h1 text-accent">{s.value}</p>
                  <p className="mt-1 text-sm text-ink-secondary">{s.label}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Story */}
      {page.intro?.length > 0 && (
        <Section>
          <SectionLabel>Our story</SectionLabel>
          <div className="mt-5 max-w-3xl">
            <Prose text={page.intro.join('\n\n')} />
          </div>
        </Section>
      )}

      {/* Values */}
      {page.values?.length > 0 && (
        <Section>
          <SectionLabel>What we value</SectionLabel>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {page.values.map((v, i) => {
              const Icon = resolvePageIcon(v.icon);
              return (
                <Card key={i}>
                  <CardBody className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-ink-primary">{v.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{v.text}</p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {/* Mission */}
      {page.mission?.heading && (
        <Section>
          <Card
            className="overflow-hidden border-0"
            style={{
              background: 'linear-gradient(115deg,#3b39d9 0%,#7c4dff 50%,#c44bd6 100%)',
            }}
          >
            <CardBody className="p-8 sm:p-10">
              <h2 className="text-h2 text-white">{page.mission.heading}</h2>
              <div className="mt-4 max-w-2xl">
                <Prose text={page.mission.body} className="text-white/85" />
              </div>
            </CardBody>
          </Card>
        </Section>
      )}
    </Page>
  );
}
