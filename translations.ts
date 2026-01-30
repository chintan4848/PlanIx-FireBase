import { Language, TaskStatus } from './types';

export const translations: Record<Language, any> = {
  EN: {
    sidebar: {
      workspace: 'Workspace',
      navigation: 'Navigation',
      board: 'Workflow',
      analytics: 'Analytics',
      developers: 'Developers',
      identity: 'Identity',
      supervisor: 'Supervisor',
      sprint_active: 'Sprint Active',
      admin: 'Admin Center',
      profile: 'User Profile',
      team_hub: 'Team Hub',
      locked: 'Locked'
    },
    nav: {
      search: 'Search tasks or IDs...',
      actions: 'Actions',
      export_pdf: 'Export Report',
      export_pdf_sub: 'Sprint summary (PDF)',
      copy_all: 'Copy All Links',
      copy_all_sub: 'Clipboard bulk copy',
      backup: 'Cloud Backup (JSON)',
      restore: 'Restore Data',
      reset: 'Reset Board',
      reset_sub: 'Permanently clear tasks',
      import_ids: 'Import IDs',
      filter_priority: 'Priority Filter',
      all_priorities: 'All Priorities',
      show_closed: 'Show Closed',
      hide_closed: 'Hide Closed',
      logout: 'Logout'
    },
    auth: {
      login: 'Sign In',
      register: 'Join Planix',
      forgot: 'Recovery Portal',
      username: 'Username',
      password: 'Password',
      name: 'Full Name',
      submit_login: 'Authorize Session',
      submit_register: 'Create Identity',
      submit_forgot: 'Send Recovery Link',
      no_account: "Create New Node",
      has_account: "Member Sign-In",
      forgot_link: "Forgot password?",
      welcome: 'Welcome Back',
      subtitle: 'System authentication required',
      logout_confirm_title: 'Terminate Session',
      logout_confirm_desc: 'Are you sure you want to de-authorize your current workspace access?',
      logout_confirm_btn: 'Exit Protocol',
      logout_abort: 'Abort'
    },
    profile: {
      title: 'Profile Settings',
      info: 'Personal Information',
      save: 'Save Changes',
      updated: 'Profile successfully updated',
      email_required_notice: 'Primary email required to complete node registration.',
      tabs: {
        account: 'Account',
        security: 'Security',
        preferences: 'Preferences'
      },
      security: {
        title: 'Authentication Protocol',
        change_pass: 'Update Password',
        current_pass: 'Current Password',
        new_pass: 'New Password',
        confirm_pass: 'Confirm New Password',
        pass_updated: 'Password updated successfully'
      },
      preferences: {
        title: 'Interface Preferences',
        theme: 'System Theme',
        language: 'System Language'
      }
    },
    admin: {
      title: 'Global Administration',
      users: 'User Directory',
      total_tasks: 'Global Task Count',
      system_load: 'System Resource Load',
      edit_user: 'Manage Access',
      user_role: 'Access Tier',
      reset_pass: 'Credentials Override',
      save_user: 'Confirm Protocol',
      update_success: 'Security protocol updated successfully'
    },
    statuses: {
      [TaskStatus.TO_DO]: 'To Do',
      [TaskStatus.IN_PROGRESS]: 'In Progress',
      [TaskStatus.REVIEW]: 'Review',
      [TaskStatus.DONE]: 'Done',
    },
    task: {
      assignee: 'Assignee',
      time_logged: 'Time Logged',
      move_status: 'Move Status',
      edit: 'Edit Task',
      delete: 'Delete Task',
      priority: 'Priority Level',
      stage: 'Current Stage',
      commit: 'Commit Updates',
      preview: 'Quick Preview',
      close: 'Close Task',
      unclose: 'Reopen Task',
      closed: 'Closed',
    },
    analytics: {
      intel: 'Operations Intelligence',
      pulse: "Today's Pulse",
      velocity: 'Velocity',
      work: 'Total Work',
      load: 'Urgency Load',
      flow: 'Productivity Flow',
      flow_sub: 'Weekly throughput (Done Tasks)',
      health: 'Health Map',
      health_sub: 'Status spread',
      pressure: 'Pressure Points',
      assessment: 'Priority Assessment',
      aggregate: 'Aggregate Tasks',
      efficiency: 'Efficiency Score',
      lead_time: 'Lead Time',
      throughput: 'Throughput',
    },
    modal: {
      sync: 'Sync Protocol',
      import: 'Planix Import',
      ids: 'Identifiers',
      excel: 'Import Excel',
      unique_ids: 'UNIQUE IDS',
      execute: 'Execute Sync Protocol',
      placeholder: 'Enter Redmine IDs or upload an Excel file...',
    },
    tour: {
      steps: [
        { title: 'Welcome to Planix', content: 'Precision-engineered task orchestration starts here. Let\'s initialize your terminal.' },
        { title: 'Navigation Core', content: 'Switch between your workflow board, advanced analytics, and system registries.' },
        { title: 'Data Ingestion', content: 'Import Redmine IDs or Excel manifests to synchronize your active workload.' },
        { title: 'Identity Vault', content: 'Configure your cryptographic keys and personal metadata in the user profile.' }
      ],
      next: 'Next Phase',
      finish: 'Initialize',
      skip: 'Skip'
    }
  },
  JA: {
    sidebar: {
      workspace: 'ワークスペース',
      navigation: 'ナビゲーション',
      board: 'ワークフロー',
      analytics: 'アナリティクス',
      developers: '開発者',
      identity: 'アイデンティティ',
      supervisor: '管理者',
      sprint_active: 'スプリント実行中',
      admin: '管理センター',
      profile: 'プロフィール',
      team_hub: 'チームハブ',
      locked: 'ロック中'
    },
    nav: {
      search: 'タスクまたはIDを検索...',
      actions: 'アクション',
      export_pdf: 'レポート出力',
      export_pdf_sub: '要約 (PDF)',
      copy_all: 'リンクを一括コピー',
      copy_all_sub: 'クリップボードへ保存',
      backup: 'クラウドバックアップ',
      restore: 'データを復元',
      reset: 'ボードをリセット',
      reset_sub: '全タスクを消去',
      import_ids: 'IDをインポート',
      filter_priority: '優先度フィルター',
      all_priorities: 'すべての優先度',
      show_closed: '完了済みを表示',
      hide_closed: '完了済みを非表示',
      logout: 'ログアウト'
    },
    auth: {
      login: 'ログイン',
      register: '新規登録',
      forgot: 'パスワード再発行',
      username: 'ユーザー名',
      password: 'パスワード',
      name: '氏名',
      submit_login: '認証してログイン',
      submit_register: 'アカウント作成',
      submit_forgot: '再発行リンクを送信',
      no_account: 'アカウントをお持ちでない方',
      has_account: '既に登録済みの方',
      forgot_link: 'パスワードをお忘れですか？',
      welcome: 'おかえりなさい',
      subtitle: '認証してワークスペースにアクセス',
      logout_confirm_title: 'セッションを終了',
      logout_confirm_desc: '現在のワークスペースへのアクセス認証を解除しますか？',
      logout_confirm_btn: 'ログアウト実行',
      logout_abort: 'キャンセル'
    },
    profile: {
      title: 'プロファイル設定',
      info: '個人情報',
      save: '変更を保存',
      updated: 'プロファイルが更新されました',
      email_required_notice: 'ノード登録を完了するにはプライマリメールアドレスが必要です。',
      tabs: {
        account: 'アカウント',
        security: 'セキュリティ',
        preferences: '環境設定'
      },
      security: {
        title: '認証プロトコル',
        change_pass: 'パスワードを更新',
        current_pass: '現在のパスワード',
        new_pass: '新しいパスワード',
        confirm_pass: '新しいパスワードを確認',
        pass_updated: 'パスワードが更新されました'
      },
      preferences: {
        title: 'インターフェース設定',
        theme: 'システムテーマ',
        language: 'システム言語'
      }
    },
    admin: {
      title: 'グローバル管理',
      users: 'ユーザーディレクトリ',
      total_tasks: '総タスク数',
      system_load: 'システム負荷',
      edit_user: 'アクセス管理',
      user_role: 'アクセス階層',
      reset_pass: 'パスワード上書き',
      save_user: 'プロトコルを確定',
      update_success: 'セキュリティプロトコルが更新されました'
    },
    statuses: {
      [TaskStatus.TO_DO]: '未着手',
      [TaskStatus.IN_PROGRESS]: '進行中',
      [TaskStatus.REVIEW]: 'レビュー',
      [TaskStatus.DONE]: '完了',
    },
    task: {
      assignee: '担当者',
      time_logged: '記録時間',
      move_status: 'ステータス移動',
      edit: '編集',
      delete: '削除',
      priority: '優先度',
      stage: '現在のステージ',
      commit: '更新を確定',
      preview: 'クイックプレビュー',
      close: 'クローズ',
      unclose: '再開',
      closed: '完了済み',
    },
    analytics: {
      intel: 'オペレーションインテリジェンス',
      pulse: '今日のパルス',
      velocity: 'ベロシティ',
      work: '総作業量'
    },
    modal: {
      sync: '同期プロトコル',
      import: 'Planix インポート',
      ids: '識別子',
      excel: 'Excelインポート',
      unique_ids: 'ユニークID',
      execute: '同期実行',
      placeholder: 'Redmine IDを入力するか、Excelファイルをアップロードしてください...',
    },
    tour: {
      steps: [
        { title: 'Planixへようこそ', content: 'ミッションクリティカルなタスク管理システムが起動しました。初期設定を開始します。' },
        { title: 'ナビゲーション', content: 'ワークフロー、アナリティクス、システムレジストリをここで切り替えます。' },
        { title: 'データのインポート', content: 'Redmine IDやExcelファイルからタスクを同期してボードを構築します。' },
        { title: 'アイデンティティ', content: 'セキュリティプロトコルや個人のメタデータをここで管理します。' }
      ],
      next: '次へ',
      finish: '初期化完了',
      skip: 'スキップ'
    }
  },
  TH: {
    sidebar: {
      workspace: 'พื้นที่ทำงาน',
      navigation: 'การนำทาง',
      board: 'เวิร์กโฟลว์',
      analytics: 'การวิเคราะห์',
      developers: 'ผู้พัฒนา',
      identity: 'ตัวตน',
      supervisor: 'หัวหน้างาน',
      sprint_active: 'สปรินต์ที่เปิดอยู่',
      admin: 'ศูนย์ควบคุม',
      profile: 'โปรไฟล์',
      team_hub: 'ศูนย์ทีม',
      locked: 'ปิดล็อค'
    },
    nav: {
      search: 'ค้นหางานหรือ ID...',
      actions: 'การดำเนินการ',
      export_pdf: 'ส่งออกรายงาน',
      export_pdf_sub: 'สรุปสปรินต์ (PDF)',
      copy_all: 'คัดลอกลิงก์ทั้งหมด',
      copy_all_sub: 'คัดลอกไปยังคลิปบอร์ด',
      backup: 'สำรองข้อมูลคลาวด์',
      restore: 'คืนค่าข้อมูล',
      reset: 'รีเซ็ตบอร์ด',
      reset_sub: 'ลบงานทั้งหมดอย่างถาวร',
      import_ids: 'นำเข้า ID',
      filter_priority: 'ตัวกรอยลำดับความสำคัญ',
      all_priorities: 'ความสำคัญทั้งหมด',
      show_closed: 'แสดงที่ปิดแล้ว',
      hide_closed: 'ซ่อนที่ปิดแล้ว',
      logout: 'ออกจากระบบ'
    },
    auth: {
      login: 'เข้าสู่ระบบ',
      register: 'ลงทะเบียน',
      forgot: 'กู้คืนรหัสผ่าน',
      username: 'ชื่อผู้ใช้',
      password: 'รหัสผ่าน',
      name: 'ชื่อเต็ม',
      submit_login: 'เข้าสู่แดชบอร์ด',
      submit_register: 'สร้างบัญชี',
      submit_forgot: 'ส่งลิงก์กู้คืน',
      no_account: 'ยังไม่มีบัญชี?',
      has_account: 'เป็นสมาชิกอยู่แล้ว?',
      forgot_link: 'ลืมรหัสผ่าน?',
      welcome: 'ยินดีต้อนรับกลับ',
      subtitle: 'ยืนยันตัวตนเพื่อเข้าถึงพื้นที่ทำงาน',
      logout_confirm_title: 'สิ้นสุดเซสชัน',
      logout_confirm_desc: 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการเข้าถึงพื้นที่ทำงานปัจจุบัน?',
      logout_confirm_btn: 'ออกจากระบบ',
      logout_abort: 'ยกเลิก'
    },
    profile: {
      title: 'ตั้งค่าโปรไฟล์',
      info: 'ข้อมูลส่วนตัว',
      save: 'บันทึกการเปลี่ยนแปลง',
      updated: 'อัปเดตโปรไฟล์สำเร็จ',
      email_required_notice: 'จำเป็นต้องระบุอีเมลหลักเพื่อดำเนินการลงทะเบียนโหนดให้เสร็จสิ้น',
      tabs: {
        account: 'บัญชี',
        security: 'ความปลอดภัย',
        preferences: 'การตั้งค่า'
      },
      security: {
        title: 'โปรโตคอลการยืนยันตัวตน',
        change_pass: 'อัปเดตรหัสผ่าน',
        current_pass: 'รหัสผ่านปัจจุบัน',
        new_pass: 'รหัสผ่านใหม่',
        confirm_pass: 'ยืนยันรหัสผ่านใหม่',
        pass_updated: 'อัปเดตรหัสผ่านสำเร็จ'
      },
      preferences: {
        title: 'การตั้งค่าอินเทอร์เฟซ',
        theme: 'ธีมระบบ',
        language: 'ภาษาระบบ'
      }
    },
    admin: {
      title: 'การบริหารจัดการระบบ',
      users: 'รายชื่อผู้ใช้',
      total_tasks: 'จำนวนงานทั้งหมด',
      system_load: 'ภาระของระบบ',
      edit_user: 'จัดการสิทธิ์เข้าถึง',
      user_role: 'ระดับสิทธิ์',
      reset_pass: 'เขียนทับรหัสผ่าน',
      save_user: 'ยืนยันโปรโตคอล',
      update_success: 'อัปเดตโปรโตคอลความปลอดภัยสำเร็จ'
    },
    statuses: {
      [TaskStatus.TO_DO]: 'รอดำเนินการ',
      [TaskStatus.IN_PROGRESS]: 'กำลังดำเนินการ',
      [TaskStatus.REVIEW]: 'รอการตรวจสอบ',
      [TaskStatus.DONE]: 'เสร็จสิ้น',
    },
    task: {
      assignee: 'ผู้รับผิดชอบ',
      time_logged: 'เวลาที่บันทึก',
      move_status: 'เปลี่ยนสถานะ',
      edit: 'แก้ไข',
      delete: 'ลบ',
      priority: 'ลำดับความสำคัญ',
      stage: 'ขั้นตอนปัจจุบัน',
      commit: 'บันทึกการเปลี่ยนแปลง',
      preview: 'ดูตัวอย่างด่วน',
      close: 'ปิดงาน',
      unclose: 'เปิดงานใหม่',
      closed: 'ปิดแล้ว',
    },
    analytics: {
      intel: 'ข้อมูลการดำเนินงาน',
      pulse: 'ชีพจรวันนี้',
      velocity: 'ความเร็ว',
      work: 'งานทั้งหมด'
    },
    modal: {
      sync: 'โปรโตคอลการซิงค์',
      import: 'นำเข้า Planix',
      ids: 'รหัสอ้างอิง',
      excel: 'นำเข้าจาก Excel',
      unique_ids: 'ID ที่ไม่ซ้ำ',
      execute: 'เริ่มการซิงค์',
      placeholder: 'ใส่ Redmine ID หรืออัปโหลดไฟล์ Excel...',
    },
    tour: {
      steps: [
        { title: 'ยินดีต้อนรับสู่ Planix', content: 'ระบบจัดการงานประสิทธิภาพสูงพร้อมใช้งานแล้ว มาเริ่มต้นตั้งค่าเครื่องมือของคุณกัน' },
        { title: 'แกนนำทาง', content: 'สลับระหว่างบอร์ดงาน การวิเคราะห์ และการตั้งค่าระบบได้ที่นี่' },
        { title: 'การนำเข้าข้อมูล', content: 'ซิงค์ Redmine ID หรือไฟล์ Excel เพื่อสร้างรายการงานของคุณ' },
        { title: 'ศูนย์ตัวตน', content: 'จัดการรหัสความปลอดภัยและข้อมูลส่วนตัวของคุณที่โปรไฟล์' }
      ],
      next: 'ขั้นตอนถัดไป',
      finish: 'เริ่มต้นใช้งาน',
      skip: 'ข้าม'
    }
  }
};