import { Hero } from '@/components/home/Hero';
import { Problem } from '@/components/home/Problem';
import { Kit } from '@/components/home/Kit';
import { Calculator } from '@/components/home/Calculator';
import { Inverter } from '@/components/home/Inverter';
import { Battery } from '@/components/home/Battery';
import { CustomKit } from '@/components/home/CustomKit';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Compare } from '@/components/home/Compare';
import { FAQ } from '@/components/home/FAQ';
import { FinalCta } from '@/components/home/FinalCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqJsonLd, productJsonLd } from '@/lib/seo';
import { faq } from '@/lib/faq';

export default function Home() {
  return (
    <>
      <JsonLd data={productJsonLd()} />
      <JsonLd data={faqJsonLd(faq)} />

      <Hero />
      <Problem />
      <Kit />
      <Calculator />
      <Inverter />
      <Battery />
      <CustomKit />
      <HowItWorks />
      <Compare />
      <FAQ />
      <FinalCta />
    </>
  );
}
