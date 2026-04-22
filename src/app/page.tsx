"use client";

import Link from "next/link";
import { useState } from "react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  Rating,
  Stack,
  Typography,
} from "@mui/material";

import Logo from "@/components/logo/logo";
import { landingPathFor } from "@/config/roles";
import NiArrowRight from "@/icons/nexture/ni-arrow-right";
import NiBook from "@/icons/nexture/ni-book";
import NiCamera from "@/icons/nexture/ni-camera";
import NiCoin from "@/icons/nexture/ni-coin";
import NiCrossSquare from "@/icons/nexture/ni-cross-square";
import NiCrown from "@/icons/nexture/ni-crown";
import NiDocumentCheck from "@/icons/nexture/ni-document-check";
import NiHeadset from "@/icons/nexture/ni-headset";
import NiPlay from "@/icons/nexture/ni-play";
import NiShieldCheck from "@/icons/nexture/ni-shield-check";
import NiSparkle from "@/icons/nexture/ni-sparkle";
import NiStars from "@/icons/nexture/ni-stars";
import { useBrochures } from "@/lib/brochures-store";
import { packageDiscount, useCoinPricing } from "@/lib/coin-pricing-store";
import { useCreditPackages } from "@/lib/credit-packages-store";
import { useCurrentUser } from "@/lib/current-user";
import { useDemoVideoUrl } from "@/lib/demo-video";
import { formatIDR } from "@/lib/format";
import { useLandingContent } from "@/lib/landing-content";
import { useRole } from "@/lib/role-context";
import { useTestimonials } from "@/lib/testimonials-store";

const FEATURES = [
  {
    icon: <NiBook size="large" />,
    title: "Quiz Adaptif",
    desc: "Pre-test, ujian, dan video quiz dengan pembahasan lengkap per opsi. Anti-cheat otomatis.",
  },
  {
    icon: <NiCamera size="large" />,
    title: "Sesi Zoom Live",
    desc: "Belajar langsung dengan guru top dalam waiting room interaktif + chat live.",
  },
  {
    icon: <NiCrown size="large" />,
    title: "Sesi Privat 1-on-1",
    desc: "Request sesi privat dengan guru pilihanmu sesuai jadwal. Hanya untuk tier premium.",
  },
  {
    icon: <NiCoin size="large" />,
    title: "Sistem Poin Fleksibel",
    desc: "Beli paket poin, pakai untuk quiz atau sesi. Tier otomatis naik seiring saldo.",
  },
  {
    icon: <NiShieldCheck size="large" />,
    title: "Anti-Cheat Ketat",
    desc: "Deteksi pindah tab, tab switch counter, auto-flag untuk review admin.",
  },
  {
    icon: <NiHeadset size="large" />,
    title: "Helpdesk Realtime",
    desc: "Chat langsung dengan admin EduDoc kalau ada kendala akses atau pembayaran.",
  },
];

export default function LandingPage() {
  const { user, loaded } = useCurrentUser();
  const { role } = useRole();
  const { list: packages } = useCreditPackages();
  const { list: testimonials } = useTestimonials();
  const { list: brochures } = useBrochures();
  const { embed: demoEmbed } = useDemoVideoUrl();
  const { content: lc } = useLandingContent();
  const { pricing } = useCoinPricing();
  const [demoOpen, setDemoOpen] = useState(false);

  const isAuthed = loaded && !!user.email;
  const dashboardHref = landingPathFor(role);
  const sortedPackages = [...packages].sort((a, b) => a.order - b.order);

  return (
    <Box className="min-h-screen">
      {/* Header */}
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(12px)",
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 2 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Logo classNameFull="flex" classNameMobile="hidden" />
            </Link>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {isAuthed ? (
                <Button
                  component={Link}
                  href={dashboardHref}
                  variant="contained"
                  color="primary"
                  size="medium"
                  endIcon={<NiArrowRight size="small" />}
                >
                  Kembali ke Dashboard
                </Button>
              ) : (
                <>
                  <Button component={Link} href="/login" variant="text" color="grey" size="medium">
                    Masuk
                  </Button>
                  <Button
                    component={Link}
                    href="/register"
                    variant="contained"
                    color="primary"
                    size="medium"
                  >
                    Daftar Gratis
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Hero */}
      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 12 } }}>
        <Grid container spacing={5} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Chip
              icon={<NiSparkle size="small" />}
              label={lc.heroBadge}
              color="primary"
              variant="outlined"
              sx={{ mb: 3 }}
            />
            <Typography variant="h1" component="h1" sx={{ mb: 2 }}>
              {lc.heroTitleLead} <span className="text-primary">{lc.heroTitleAccent1}</span>
              <br />
              {lc.heroTitleConnector} <span className="text-primary">{lc.heroTitleAccent2}</span>
            </Typography>
            <Typography variant="body1" className="text-text-secondary" sx={{ mb: 4, maxWidth: 560 }}>
              {lc.heroDescription}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                component={Link}
                href="/register"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<NiSparkle size="medium" />}
              >
                {lc.heroPrimaryCta}
              </Button>
              {demoEmbed && (
                <Button
                  onClick={() => setDemoOpen(true)}
                  variant="surface"
                  color="grey"
                  size="large"
                  startIcon={<NiPlay size="medium" />}
                >
                  {lc.heroSecondaryCta}
                </Button>
              )}
            </Stack>
            <Stack direction="row" spacing={3} sx={{ mt: 5 }} flexWrap="wrap" rowGap={1.5}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <NiShieldCheck size="small" />
                <Typography variant="body2" className="text-text-secondary">
                  Anti-cheat otomatis
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <NiStars size="small" />
                <Typography variant="body2" className="text-text-secondary">
                  Tier otomatis berdasarkan poin
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <NiHeadset size="small" />
                <Typography variant="body2" className="text-text-secondary">
                  Helpdesk realtime
                </Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              sx={{
                p: 0,
                overflow: "hidden",
                transform: { md: "rotate(-2deg)" },
                transition: "transform 0.3s",
                "&:hover": { transform: { md: "rotate(0deg)" } },
              }}
            >
              <CardContent className="flex flex-col gap-5">
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Chip
                    icon={<NiCoin size="small" />}
                    label="Point Wallet"
                    color="warning"
                    variant="outlined"
                    size="small"
                  />
                  <Chip label="Tier Plus" color="primary" size="small" />
                </Stack>
                <Box>
                  <Typography variant="h1" component="p">
                    1.280
                    <Typography variant="h5" component="span" className="text-text-secondary-light ms-2">
                      poin
                    </Typography>
                  </Typography>
                  <Typography variant="body2" className="text-text-secondary">
                    Setara Rp 640.000 nilai belajar
                  </Typography>
                </Box>
                <Divider />
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="caption" className="text-text-secondary-dark">
                      Quiz Selesai
                    </Typography>
                    <Typography variant="h5">42</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" className="text-text-secondary-dark">
                      Sesi Diikuti
                    </Typography>
                    <Typography variant="h5">18</Typography>
                  </Grid>
                </Grid>
                <Button variant="pastel" color="primary" fullWidth startIcon={<NiDocumentCheck size="medium" />}>
                  Mulai Quiz
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Alumni Slider */}
      {brochures.length > 0 && (
        <Box sx={{ bgcolor: "background.paper", py: { xs: 5, md: 8 } }}>
          <Container maxWidth="xl">
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography variant="overline" color="primary" component="p">
                Alumni Kami
              </Typography>
              <Typography variant="h3" component="h2" sx={{ mt: 0.5 }}>
                Mereka yang sudah lolos
              </Typography>
            </Box>
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={20}
              slidesPerView={1}
              speed={500}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
                waitForTransition: true,
              }}
              navigation
              pagination={{ clickable: true }}
              loop={brochures.length >= 2}
              loopAdditionalSlides={brochures.length}
              breakpoints={{
                640: { slidesPerView: Math.min(brochures.length, 2) },
                1024: { slidesPerView: Math.min(brochures.length, 3) },
              }}
              style={{ paddingBottom: 50 }}
            >
              {brochures.map((b) => (
                <SwiperSlide key={b.id}>
                  <Card sx={{ overflow: "hidden", height: "100%" }}>
                    <Box
                      component="img"
                      src={b.image}
                      alt={b.title}
                      sx={{ width: "100%", aspectRatio: "2 / 1", objectFit: "cover", display: "block" }}
                    />
                    <CardContent>
                      <Typography variant="h6">{b.title}</Typography>
                      {b.subtitle && (
                        <Typography variant="body2" className="text-text-secondary">
                          {b.subtitle}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </SwiperSlide>
              ))}
            </Swiper>
          </Container>
        </Box>
      )}

      {/* Features */}
      <Box sx={{ bgcolor: "background.paper", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="overline" color="primary" component="p">
              {lc.featuresBadge}
            </Typography>
            <Typography variant="h2" component="h2" sx={{ mt: 1 }}>
              {lc.featuresTitleLead} <span className="text-primary">{lc.featuresTitleAccent}</span>
            </Typography>
            <Typography variant="body1" className="text-text-secondary" sx={{ mt: 2, maxWidth: 640, mx: "auto" }}>
              {lc.featuresSubtitle}
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            {FEATURES.map((f) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={f.title}>
                <Card sx={{ height: "100%" }}>
                  <CardContent className="flex flex-col gap-3">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: "primary.light",
                        color: "primary.main",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Typography variant="h6">{f.title}</Typography>
                    <Typography variant="body2" className="text-text-secondary">
                      {f.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing (dynamic from admin + Swiper) */}
      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="overline" color="primary" component="p">
            {lc.pricingBadge}
          </Typography>
          <Typography variant="h2" component="h2" sx={{ mt: 1 }}>
            {lc.pricingTitleLead} <span className="text-primary">{lc.pricingTitleAccent}</span>
          </Typography>
          <Typography variant="body1" className="text-text-secondary" sx={{ mt: 2, maxWidth: 640, mx: "auto" }}>
            {lc.pricingSubtitle}
          </Typography>
        </Box>

        {sortedPackages.length === 0 ? (
          <Typography align="center" variant="body2" className="text-text-secondary">
            Belum ada paket.
          </Typography>
        ) : (
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            style={{ paddingBottom: 50 }}
          >
            {sortedPackages.map((pkg) => {
              const discount = packageDiscount(pkg.price, pkg.points, pricing.pricePerCoin);
              return (
              <SwiperSlide key={pkg.id}>
                <Card
                  variant={pkg.popular ? "elevation" : "outlined"}
                  sx={{
                    height: "100%",
                    borderColor: pkg.popular ? "primary.main" : "divider",
                    borderWidth: pkg.popular ? 2 : 1,
                  }}
                >
                  <CardContent className="flex flex-col gap-3">
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6">Paket {pkg.points} pts</Typography>
                      {pkg.popular && <Chip label="Populer" color="primary" size="small" />}
                    </Stack>
                    <Box>
                      <Typography variant="h4">{formatIDR(pkg.price)}</Typography>
                      <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }} flexWrap="wrap" rowGap={0.5}>
                        {discount > 0 && (
                          <Chip size="small" color="success" label={`Hemat ${discount}%`} />
                        )}
                        {pkg.bonus ? (
                          <Chip
                            size="small"
                            color="warning"
                            variant="outlined"
                            label={`+${pkg.bonus} bonus`}
                          />
                        ) : null}
                      </Stack>
                    </Box>
                    <Divider />
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <NiCoin size="small" />
                        <Typography variant="body2" className="text-text-secondary">
                          {pkg.points} poin untuk quiz, sesi, & bundle premium
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <NiShieldCheck size="small" />
                        <Typography variant="body2" className="text-text-secondary">
                          Tier otomatis naik seiring saldo
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <NiHeadset size="small" />
                        <Typography variant="body2" className="text-text-secondary">
                          Helpdesk realtime
                        </Typography>
                      </Stack>
                    </Stack>
                    <Button
                      component={Link}
                      href="/register"
                      variant={pkg.popular ? "contained" : "pastel"}
                      color="primary"
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      Beli {pkg.points} pts
                    </Button>
                  </CardContent>
                </Card>
              </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </Container>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <Box sx={{ bgcolor: "background.paper", py: { xs: 6, md: 10 } }}>
          <Container maxWidth="xl">
            <Box sx={{ textAlign: "center", mb: 5 }}>
              <Typography variant="overline" color="primary" component="p">
                {lc.testimonialsBadge}
              </Typography>
              <Typography variant="h2" component="h2" sx={{ mt: 1 }}>
                {lc.testimonialsTitleLead} <span className="text-primary">{lc.testimonialsTitleAccent}</span>
              </Typography>
            </Box>
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={24}
              slidesPerView={1}
              speed={500}
              autoplay={{
                delay: 6000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
                waitForTransition: true,
              }}
              navigation
              pagination={{ clickable: true }}
              loop={testimonials.length >= 2}
              loopAdditionalSlides={testimonials.length}
              breakpoints={{
                640: { slidesPerView: Math.min(testimonials.length, 2) },
                1024: { slidesPerView: Math.min(testimonials.length, 3) },
              }}
              style={{ paddingBottom: 55 }}
            >
              {testimonials.map((t) => (
                <SwiperSlide key={t.id} style={{ height: "auto" }}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      overflow: "visible",
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.light}22 100%)`,
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "transform .25s, box-shadow .25s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    {/* Decorative quote mark */}
                    <Box
                      aria-hidden
                      sx={{
                        position: "absolute",
                        top: -12,
                        left: 16,
                        fontSize: 88,
                        lineHeight: 1,
                        fontFamily: "Georgia, serif",
                        color: "primary.main",
                        opacity: 0.18,
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    >
                      &ldquo;
                    </Box>
                    <CardContent sx={{ pt: 4, pb: 3, flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                      <Rating value={t.rating} readOnly size="small" />
                      <Typography
                        variant="body1"
                        sx={{
                          flex: 1,
                          fontStyle: "italic",
                          color: "text.primary",
                          lineHeight: 1.6,
                          display: "-webkit-box",
                          WebkitLineClamp: 6,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {t.message}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider" }}
                      >
                        <Avatar
                          src={t.avatar}
                          sx={{
                            width: 48,
                            height: 48,
                            border: "2px solid",
                            borderColor: "primary.main",
                          }}
                        >
                          {t.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {t.name}
                          </Typography>
                          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                            {t.role}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </SwiperSlide>
              ))}
            </Swiper>
          </Container>
        </Box>
      )}

      {/* CTA */}
      <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Chip label={lc.ctaBadge} color="warning" variant="filled" size="small" />
            <Typography variant="h2" component="h2" color="inherit">
              {lc.ctaTitleLead} <span style={{ textDecoration: "underline" }}>{lc.ctaTitleAccent}</span>
            </Typography>
            <Typography variant="body1" color="inherit" sx={{ opacity: 0.9, maxWidth: 560 }}>
              {lc.ctaDescription}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
              <Button
                component={Link}
                href="/register"
                variant="contained"
                color="warning"
                size="large"
                startIcon={<NiSparkle size="medium" />}
              >
                {lc.ctaPrimaryButton}
              </Button>
              {demoEmbed ? (
                <Button
                  onClick={() => setDemoOpen(true)}
                  variant="outlined"
                  color="inherit"
                  size="large"
                  startIcon={<NiPlay size="medium" />}
                >
                  {lc.ctaSecondaryButton}
                </Button>
              ) : (
                <Button
                  component={Link}
                  href="/login"
                  variant="outlined"
                  color="inherit"
                  size="large"
                >
                  Saya sudah punya akun
                </Button>
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ bgcolor: "background.paper", py: 4, borderTop: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Logo classNameFull="flex" classNameMobile="hidden" />
            </Stack>
            <Typography variant="caption" className="text-text-secondary-light">
              © {new Date().getFullYear()} EduDoc — Platform Bimbel Online Premium
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* Demo video dialog */}
      <Dialog open={demoOpen} onClose={() => setDemoOpen(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 0, position: "relative", bgcolor: "black" }}>
          <IconButton
            onClick={() => setDemoOpen(false)}
            sx={{ position: "absolute", top: 8, right: 8, zIndex: 2, bgcolor: "rgba(0,0,0,0.5)", color: "white" }}
            size="small"
          >
            <NiCrossSquare size="small" />
          </IconButton>
          {demoEmbed && (
            <Box sx={{ position: "relative", width: "100%", aspectRatio: "16 / 9" }}>
              <Box
                component="iframe"
                src={demoEmbed}
                title="Demo EduDoc"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
