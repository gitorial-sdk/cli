mod user;

use user::User;

fn main() {
    let user = User::new(/* TODO */);
    println!("{}", user.summary());
}
