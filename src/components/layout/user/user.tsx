"use client";

import UserLanguageSwitch from "./user-language-switch";
import UserModeSwitch from "./user-mode-switch";
import UserThemeSwitch from "./user-theme-switch";
import Link from "next/link";
import { useSnackbar } from "notistack";
import * as React from "react";

import { Avatar, Box, Card, CardContent, Divider, Fade, ListItemIcon, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Popper from "@mui/material/Popper";

import { ROLE_LABEL } from "@/config/roles";
import NiPower from "@/icons/nexture/ni-power";
import NiSettings from "@/icons/nexture/ni-settings";
import NiUser from "@/icons/nexture/ni-user";
import { logAudit } from "@/lib/audit-store";
import { useCurrentUser } from "@/lib/current-user";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

export default function User() {
  const [open, setOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const { user, clear } = useCurrentUser();
  const { role, setRole } = useRole();
  const { enqueueSnackbar } = useSnackbar();

  const displayName = user.name || "Pengguna EduDoc";
  const displayEmail = user.email || "—";
  const firstName = displayName.split(" ")[0] || "Pengguna";

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    // Log SEBELUM clear() — supaya localStorage actor masih ada untuk logAudit
    logAudit({ action: "USER_LOGOUT", target: "manual" });
    await clear();
    setRole("STUDENT");
    setOpen(false);
    enqueueSnackbar("Berhasil keluar dari EduDoc", { variant: "success" });
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  };

  return (
    <>
      <Box ref={anchorRef}>
        {/* Desktop trigger */}
        <Button
          variant="surface"
          color="text-primary"
          className={cn(
            "group ms-2 hidden gap-2 rounded-lg py-0! pe-0! hover:py-1! hover:pe-1.5! md:flex",
            open && "active py-1! pe-1.5!",
          )}
          onClick={handleToggle}
        >
          <Box>{firstName}</Box>
          <Avatar
            alt={displayName}
            src={user.avatar || undefined}
            className={cn(
              "large transition-all group-hover:ms-0.5 group-hover:h-8 group-hover:w-8",
              open && "ms-0.5 h-8! w-8!",
            )}
          >
            {firstName.charAt(0).toUpperCase()}
          </Avatar>
        </Button>

        {/* Mobile trigger */}
        <Button
          variant="surface"
          size="large"
          color="text-primary"
          className={cn(
            "icon-only hover-icon-shrink [&.active]:text-primary group ms-1 me-1 p-0! hover:p-1.5! md:hidden",
            open && "active p-1.5!",
          )}
          onClick={handleToggle}
          startIcon={
            <Avatar
              alt={displayName}
              src={user.avatar || undefined}
              className={cn("large transition-all group-hover:h-7 group-hover:w-7", open && "h-7! w-7!")}
            >
              {firstName.charAt(0).toUpperCase()}
            </Avatar>
          }
        />
      </Box>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement="bottom-end"
        className="mt-3!"
        transition
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps}>
            <Box>
              <ClickAwayListener onClickAway={handleClose}>
                <Card className="shadow-darker-sm!">
                  <CardContent>
                    <Box className="max-w-64 sm:w-72 sm:max-w-none">
                      <Box className="mb-4 flex flex-col items-center">
                        <Avatar alt={displayName} src={user.avatar || undefined} className="large mb-2">
                          {firstName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="subtitle2" component="p" className="mb-1">
                          {displayName}
                        </Typography>
                        <Typography variant="body2" component="p" className="text-text-secondary -mt-2">
                          {displayEmail}
                        </Typography>
                        <Typography
                          variant="caption"
                          component="p"
                          className="text-primary mt-2 tracking-widest uppercase"
                        >
                          {ROLE_LABEL[role]}
                        </Typography>
                      </Box>

                      <Divider className="large" />

                      <MenuList className="p-0">
                        <MenuItem component={Link} href="/profile" onClick={handleClose}>
                          <ListItemIcon>
                            <NiUser size={20} />
                          </ListItemIcon>
                          Profil
                        </MenuItem>
                        <MenuItem component={Link} href="/account-settings" onClick={handleClose}>
                          <ListItemIcon>
                            <NiSettings size={20} />
                          </ListItemIcon>
                          Pengaturan Akun
                        </MenuItem>

                        <Divider className="large" />

                        <UserModeSwitch />
                        <UserThemeSwitch />
                        <UserLanguageSwitch />
                      </MenuList>

                      <Box className="my-6" />
                      <Button
                        variant="outlined"
                        size="tiny"
                        color="grey"
                        className="w-full"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        startIcon={<NiPower size={16} />}
                      >
                        {loggingOut ? "Keluar..." : "Keluar"}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </ClickAwayListener>
            </Box>
          </Fade>
        )}
      </Popper>
    </>
  );
}
