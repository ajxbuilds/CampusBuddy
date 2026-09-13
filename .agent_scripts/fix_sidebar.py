import re

path = 'c:/Users/Ajinkya/Desktop/projects/PBL/frontend/src/components/layout/Sidebar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

fixed_imports = """import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Bot, Trophy, HelpCircle, User, Users,
  LogOut, ChevronLeft, ChevronRight, GraduationCap, X, Shield, FileText, AlertTriangle, Settings, Upload, Flag, Link as LinkIcon
} from 'lucide-react';"""

content = re.sub(r"import React from 'react';\s*import \{\s*LayoutDashboard.*?\} from 'lucide-react';", fixed_imports, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
