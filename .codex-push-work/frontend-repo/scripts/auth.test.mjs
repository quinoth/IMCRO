import assert from "node:assert/strict";
import {
  authenticate,
  canAccessAdmin,
  canAccessDomuAdmin,
  canAccessTpmpkAdmin,
  canManageUsers,
  getRoleLabel,
  getUserPermissions,
  hasPermission,
  mergeTestUserProfile,
  TEST_CREDENTIALS,
  TEST_USERS,
} from "../src/auth.js";

for (const credentials of TEST_CREDENTIALS) {
  assert.equal(authenticate(credentials.email, credentials.password)?.role, credentials.role);
}
assert.equal(authenticate("admin@mky.test", "wrong"), null);

const enrichedOperator = mergeTestUserProfile({
  id: 901,
  email: "operator@mky.test",
  username: "tpmpk_operator",
  role: "operator",
  access_token: "token",
});
assert.equal(enrichedOperator.firstName, TEST_USERS.operator.firstName);
assert.equal(enrichedOperator.created_at, TEST_USERS.operator.created_at);
assert.equal(enrichedOperator.access_token, "token");

assert.equal(canAccessAdmin(TEST_USERS.user), false);
assert.equal(canAccessAdmin(TEST_USERS.methodist), true);
assert.equal(canAccessAdmin(TEST_USERS.admin), true);
assert.equal(canAccessAdmin(TEST_USERS.operator), false);
assert.equal(canAccessAdmin(TEST_USERS.domu_editor), false);

assert.equal(canAccessTpmpkAdmin(TEST_USERS.user), false);
assert.equal(canAccessTpmpkAdmin(TEST_USERS.operator), true);
assert.equal(canAccessTpmpkAdmin(TEST_USERS.admin), true);

assert.equal(canAccessDomuAdmin(TEST_USERS.user), false);
assert.equal(canAccessDomuAdmin(TEST_USERS.domu_editor), true);
assert.equal(canAccessDomuAdmin(TEST_USERS.methodist), true);
assert.equal(canAccessDomuAdmin(TEST_USERS.admin), true);

assert.equal(canManageUsers(TEST_USERS.user), false);
assert.equal(canManageUsers(TEST_USERS.methodist), false);
assert.equal(canManageUsers(TEST_USERS.admin), true);

assert.equal(hasPermission(TEST_USERS.methodist, "articles", "edit"), true);
assert.equal(hasPermission(TEST_USERS.methodist, "users_roles", "view"), false);
assert.equal(hasPermission({ ...TEST_USERS.methodist, permissions: { articles: "view" } }, "articles", "edit"), false);
assert.equal(getUserPermissions(TEST_USERS.admin).users_roles, "edit");

assert.equal(getRoleLabel("user"), "Пользователь");
assert.equal(getRoleLabel("methodist"), "Методист");
assert.equal(getRoleLabel("admin"), "Администратор");

console.log("auth tests passed");
